/**
 *
 *
 * Zustand Store (stores/firestoreStore.js)
 *
 * Firestoreとのやり取り（購読・書き込み）をこのストアに集約する。
 * コンポーネント側は「どんなクエリか」「Timestampの変換が必要か」を知らずに、
 * timeline / comments といった “できあがったデータ” を受け取るだけで済む。
 *
 */

import { db } from '@/lib/firebase';
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  startAfter,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { create } from 'zustand';

const useFirestoreStore = create((set, get) => ({
  // --- State ---
  // 「特定ユーザーの投稿一覧」用。プロフィールページで使う
  posts: [],
  loading: true,
  error: null,
  unsubscribe: null,

  // タイムライン用State（おすすめ＝全体タイムライン）
  timeline: [],
  timelineLoading: false,
  timelineHasMore: true,
  timelineLastDoc: null, // ページング（追加読込み）の起点「直近で取得した最後のドキュメント」
  timelineUnsubscribe: null, // タイムライン購読解除（リアルタイム）

  // 「フォロー中」タイムライン用State（15章で追加）
  // 全体タイムラインとまったく同じ構造の状態をもう1セット用意している。
  // 1セットを使い回すとタブを切り替えるたびに中身が消えてしまい、
  // 「戻ってきたらまた読み込み直し」になるため、あえて分けている。
  followingTimeline: [],
  followingTimelineLoading: false,
  followingTimelineHasMore: true,
  followingTimelineLastDoc: null,
  followingTimelineUnsubscribe: null,

  // 投稿詳細ページ用State（posts/{postId} を1件だけ購読する）
  currentPost: null,
  currentPostLoading: true,
  currentPostUnsubscribe: null,

  // コメント用State（posts/{postId}/comments サブコレクション）
  comments: [],
  commentsLoading: false,
  commentsUnsubscribe: null,

  // プロフィールページ用State（users/{uid} ドキュメント）
  profileUser: null,
  profileUserLoading: true,
  profileUserUnsubscribe: null,

  // ==============================
  // タイムライン：リアルタイム購読（最新の10件）
  // ==============================
  subscribeTimeline: () => {
    // get()：Zustandのストアが持つ「今この瞬間のstate」を取得するための関数。
    // { timlineUnsubscribe: prev }は、
    // state.timlineUnsubscribeを取り出しつつ、ローカル変数名(prev)に付け替えている（分割代入の別名指定）
    const { timelineUnsubscribe: prev } = get();

    // prevが存在する=前回これを呼んだときの購読がまだ生きている状態。
    // 何もせずに新しいonSnapshotを張ると、古い購読と新しい購読の両方が同時に動いてしまい
    // 2重更新や不要な読み取りの原因となる。
    // そのため、新しい購読を始める前に必ず古い方を止める。
    if (prev) prev();
    // 購読しなおすタイミングでページング状態も初期化する
    set({
      timeline: [],
      timelineLoading: true,
      timelineHasMore: true,
      timelineLastDoc: null,
      error: null,
    });
    // 絞り込み無し・createAt降順で先頭の10件だけを対象にするクエリ
    const q = query(
      collection(db, 'posts'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        // onSnapshotは「クエリ結果を1回取得して終わり」ではなく
        // 該当データがサーバー側で変化する度に第二引数のコールバックを
        // 自動で呼び出してくれる（リアルタイム購読）

        // snapshot.docsは該当する全ドキュメントのスナップショット配列
        const posts = snapshot.docs.map((d) => ({
          id: d.id, // ドキュメントIDは、d.data()の中身には含まれないので別途取り出す
          ...d.data(),
          // Firestore上では、Timestamp型で保存されているため
          // JS側で扱いやすいDate型に変換してからstateへ入れる
          createdAt: d.data().createdAt?.toDate(),
        }));

        // ページング（loadMoreTimeline）の起点にするため、
        // 取得できた中で一番最後（＝一番古い）のドキュメントを覚えておく。
        // 0件のときは null のままにする。
        const lastDoc = snapshot.docs[snapshot.docs.length - 1] ?? null;

        set({
          timeline: posts,
          timelineLoading: false,
          // 取得件数がちょうどlimit(10)と同じ＝まだ続きがあるかもしれない、
          // という簡易的な「もっとある」判定
          timelineHasMore: snapshot.docs.length === 10,
          timelineLastDoc: lastDoc,
          timelineUnsubscribe: unsub,
        });
      },
      (error) => {
        console.error('subscribeTimeline error:', error);
        set({
          timelineLoading: false,
          error: error.message,
          timelineUnsubscribe: null,
        });
      }
    );

    set({ timelineUnsubscribe: unsub });
  },

  // タイムライン：購読停止
  unsubscribeTimeline: () => {
    const { timelineUnsubscribe } = get();
    if (timelineUnsubscribe) {
      timelineUnsubscribe();
      set({ timelineUnsubscribe: null });
    }
  },

  // ==============================
  // タイムライン：次の10件を取得（ページング／無限スクロール）
  // ==============================
  // 最新10件は onSnapshot でリアルタイム表示している。
  // それより古い分は「一度取れれば十分」なので、リアルタイム購読ではなく
  // getDocs（1回きりの取得）を使う。
  loadMoreTimeline: async () => {
    const { timelineLastDoc, timelineHasMore, timelineLoading } = get();

    // ガード節。
    //   - もう続きが無い
    //   - 今まさに読み込み中（スクロールで何度も発火するため重要）
    //   - まだ1回も購読していない／0件
    // のいずれかなら何もしない。
    if (!timelineHasMore || timelineLoading) return;
    if (!timelineLastDoc) return;

    set({ timelineLoading: true, error: null });

    try {
      // startAfter(lastDoc): 「このドキュメントより後ろから」取得する指定。
      // ページ番号ではなく「前回の最後の1件」を起点にするのがFirestore流。
      // 途中で新しい投稿が増えても、ズレたり重複したりしにくい。
      const q = query(
        collection(db, 'posts'),
        orderBy('createdAt', 'desc'),
        startAfter(timelineLastDoc),
        limit(10)
      );

      const snapshot = await getDocs(q);
      const newPosts = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate(),
      }));

      // 今回0件だった場合は lastDoc を更新せず、前回の値を維持する
      const lastDoc =
        snapshot.docs[snapshot.docs.length - 1] ?? timelineLastDoc;

      set((state) => {
        // リアルタイム購読(subscribeTimeline)とページングは別々に動くため、
        // 同じ投稿が二重に入り込む可能性がある。idで重複排除しておく。
        const existingIds = new Set(state.timeline.map((p) => p.id));
        const dedupedNewPosts = newPosts.filter((p) => !existingIds.has(p.id));

        return {
          timeline: [...state.timeline, ...dedupedNewPosts],
          timelineLoading: false,
          timelineHasMore: snapshot.docs.length === 10,
          timelineLastDoc: lastDoc,
        };
      });
    } catch (error) {
      console.error('Load more timeline error:', error);
      set({ timelineLoading: false, error: error.message });
    }
  },

  // タイムラインをリセット（タブ切り替えやログアウト時のUI都合）
  resetTimeline: () => {
    set({ timeline: [], timelineHasMore: true, timelineLastDoc: null });
  },

  // ==============================
  // 「フォロー中」タイムライン：リアルタイム購読（最新の10件）
  // ==============================
  // uids: 「フォロー中のユーザー + 自分自身」のuidをまとめた配列
  subscribeFollowingTimeline: (uids) => {
    const { followingTimelineUnsubscribe: prev } = get();
    if (prev) prev();

    // ★ガードが必須。
    //   Firestoreの where(..., 'in', []) は「空配列」を渡すとエラーになる。
    //   誰もフォローしていない状態でも落ちないよう、
    //   クエリを投げずに「0件」の状態を直接セットして終わる。
    if (!uids || uids.length === 0) {
      set({
        followingTimeline: [],
        followingTimelineLoading: false,
        followingTimelineHasMore: false,
        followingTimelineLastDoc: null,
        followingTimelineUnsubscribe: null,
      });
      return;
    }

    set({
      followingTimeline: [],
      followingTimelineLoading: true,
      followingTimelineHasMore: true,
      followingTimelineLastDoc: null,
      error: null,
    });

    // ★in演算子には「配列は最大30件まで」というFirestoreの制約がある。
    //   31人以上フォローしている場合、31人目以降は切り捨てられる。
    //   実務で厳密にやるならCloud Functionsで
    //   「投稿時に各フォロワー専用のタイムラインへコピーする（Fan-out）」
    //   といった設計が必要になるが、まずは動くものを優先している。
    //
    // ★where + orderBy の組み合わせなので、subscribeToUserPosts と同じ
    //   複合インデックス（userId + createdAt）が必要。
    const q = query(
      collection(db, 'posts'),
      where('userId', 'in', uids.slice(0, 30)),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const posts = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          createdAt: d.data().createdAt?.toDate(),
        }));

        const lastDoc = snapshot.docs[snapshot.docs.length - 1] ?? null;

        set({
          followingTimeline: posts,
          followingTimelineLoading: false,
          followingTimelineHasMore: snapshot.docs.length === 10,
          followingTimelineLastDoc: lastDoc,
          followingTimelineUnsubscribe: unsub,
        });
      },
      (error) => {
        console.error('subscribeFollowingTimeline error:', error);
        set({
          followingTimelineLoading: false,
          error: error.message,
          followingTimelineUnsubscribe: null,
        });
      }
    );

    set({ followingTimelineUnsubscribe: unsub });
  },

  unsubscribeFollowingTimeline: () => {
    const { followingTimelineUnsubscribe } = get();
    if (followingTimelineUnsubscribe) {
      followingTimelineUnsubscribe();
      set({ followingTimelineUnsubscribe: null });
    }
  },

  // 「フォロー中」タイムライン：次の10件を取得（loadMoreTimelineと同じ考え方）
  loadMoreFollowingTimeline: async (uids) => {
    const {
      followingTimelineLastDoc,
      followingTimelineHasMore,
      followingTimelineLoading,
    } = get();

    if (!followingTimelineHasMore || followingTimelineLoading) return;
    if (!followingTimelineLastDoc) return;
    if (!uids || uids.length === 0) return;

    set({ followingTimelineLoading: true, error: null });

    try {
      const q = query(
        collection(db, 'posts'),
        where('userId', 'in', uids.slice(0, 30)),
        orderBy('createdAt', 'desc'),
        startAfter(followingTimelineLastDoc),
        limit(10)
      );

      const snapshot = await getDocs(q);
      const newPosts = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate(),
      }));

      const lastDoc =
        snapshot.docs[snapshot.docs.length - 1] ?? followingTimelineLastDoc;

      set((state) => {
        const existingIds = new Set(state.followingTimeline.map((p) => p.id));
        const dedupedNewPosts = newPosts.filter((p) => !existingIds.has(p.id));

        return {
          followingTimeline: [...state.followingTimeline, ...dedupedNewPosts],
          followingTimelineLoading: false,
          followingTimelineHasMore: snapshot.docs.length === 10,
          followingTimelineLastDoc: lastDoc,
        };
      });
    } catch (error) {
      console.error('Load more following timeline error:', error);
      set({ followingTimelineLoading: false, error: error.message });
    }
  },

  resetFollowingTimeline: () => {
    set({
      followingTimeline: [],
      followingTimelineHasMore: true,
      followingTimelineLastDoc: null,
    });
  },

  // ==============================
  // 特定ユーザーの投稿一覧：リアルタイム購読（プロフィールページ用）
  // ==============================
  subscribeToUserPosts: (userId) => {
    const { unsubscribe: prev } = get();
    if (prev) prev();

    set({ loading: true, error: null, posts: [] });

    // ★ここは where + orderBy の組み合わせになっている点に注意。
    // Firestoreは「絞り込みに使うフィールド」と「並べ替えに使うフィールド」が
    // 異なる場合、あらかじめ複合インデックスを用意しておく必要がある。
    // 初回実行時にブラウザのコンソールへ
    //   "The query requires an index. You can create it here: https://..."
    // というエラーが出るが、これは失敗ではなく「インデックスを作ってください」
    // というFirestoreからの案内。リンクを開いて作成すれば解決する。
    const q = query(
      collection(db, 'posts'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const posts = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          createdAt: d.data().createdAt?.toDate(),
        }));
        set({ posts, loading: false, unsubscribe: unsub });
      },
      (error) => {
        console.error('subscribeToUserPosts error:', error);
        set({ loading: false, error: error.message, unsubscribe: null });
      }
    );

    set({ unsubscribe: unsub });
  },

  unsubscribeFromPosts: () => {
    const { unsubscribe } = get();
    if (unsubscribe) unsubscribe();
    set({ unsubscribe: null, posts: [], loading: true });
  },

  // ==============================
  // 投稿を追加
  // ==============================
  addPost: async (userId, userEmail, userName, userPhotoURL, content) => {
    try {
      await addDoc(collection(db, 'posts'), {
        userId,
        userEmail: userEmail ?? '',
        userName: userName ?? '',
        userPhotoURL: userPhotoURL ?? '',
        content,
        createdAt: serverTimestamp(), //firestoreへの書込み日時
      });
    } catch (error) {
      console.error('Add Post Error', error);
      set({ error: error.message });
      throw error;
    }
  },

  // ==============================
  // 投稿を削除
  // ==============================
  deletePost: async (postId) => {
    try {
      // deleteDoc: 指定したドキュメントを1件だけ削除する。
      // なお、サブコレクション（comments）はこれでは消えない。
      // Firestoreは「親を消せば子も消える」構造ではないため、
      // 厳密にはコメントも消したい場合はCloud Functions等が必要になる。
      // 学習用アプリなのでここでは投稿ドキュメントのみ削除している。
      await deleteDoc(doc(db, 'posts', postId));
    } catch (error) {
      console.error('Delete post error:', error);
      set({ error: error.message });
      throw error;
    }
  },

  // ==============================
  // いいね切り替え（likedBy配列にuidを追加/削除）
  // ==============================
  toggleLike: async (postId, uid, isLiked) => {
    try {
      const postRef = doc(db, 'posts', postId);
      // updateDoc: 指定したフィールドだけを書き換える（他のフィールドはそのまま）。
      //
      // arrayUnion / arrayRemove はFirestoreが用意している配列専用の命令で、
      // 「今の配列を読み取って → JS側でpush/spliceして → 書き戻す」という
      // 3ステップを踏まずに済む。
      // 3ステップ方式だと、読み取ってから書き戻すまでの間に他の人が
      // いいねした分が消えてしまう（後勝ちで上書きされる）が、
      // arrayUnion/arrayRemoveならサーバー側で安全に処理される。
      //
      // isLiked は「押す前の状態」。既に押していたなら外す、まだなら付ける。
      await updateDoc(postRef, {
        likedBy: isLiked ? arrayRemove(uid) : arrayUnion(uid),
      });
    } catch (error) {
      console.error('Toggle like error:', error);
      throw error;
    }
  },

  // ==============================
  // Bad切り替え（badBy配列にuidを追加/削除）
  // ==============================
  toggleBad: async (postId, uid, isBad) => {
    try {
      // toggleLikeとまったく同じ考え方。対象フィールドが badBy になっただけ
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        badBy: isBad ? arrayRemove(uid) : arrayUnion(uid),
      });
    } catch (error) {
      console.error('Toggle bad error:', error);
      throw error;
    }
  },

  // ==============================
  // コメントのいいね / Bad切り替え
  // ==============================
  toggleCommentLike: async (postId, commentId, uid, isLiked) => {
    try {
      // doc()に引数を4つ渡すと posts/{postId}/comments/{commentId} という
      // サブコレクション配下の1ドキュメントを指せる。
      // （collection→document→collection→document、と交互に並べるのがルール）
      const commentRef = doc(db, 'posts', postId, 'comments', commentId);
      await updateDoc(commentRef, {
        likedBy: isLiked ? arrayRemove(uid) : arrayUnion(uid),
      });
    } catch (error) {
      console.error('Toggle comment like error:', error);
      throw error;
    }
  },

  toggleCommentBad: async (postId, commentId, uid, isBad) => {
    try {
      const commentRef = doc(db, 'posts', postId, 'comments', commentId);
      await updateDoc(commentRef, {
        badBy: isBad ? arrayRemove(uid) : arrayUnion(uid),
      });
    } catch (error) {
      console.error('Toggle comment bad error:', error);
      throw error;
    }
  },

  // ==============================
  // 投稿詳細：1件をリアルタイム購読
  // ==============================
  // 12章までは getDoc() で「1回だけ取得」していたが、投稿詳細ページでは
  // いいね数やコメント数が変わったらすぐ画面に反映してほしい。
  // query()ではなく doc() をそのまま onSnapshot に渡すと、
  // 「そのドキュメント1件だけ」をリアルタイム購読できる。
  subscribeToPost: (postId) => {
    const { currentPostUnsubscribe: prev } = get();
    if (prev) prev();

    set({ currentPostLoading: true, currentPost: null });

    const unsub = onSnapshot(
      doc(db, 'posts', postId),
      (snap) => {
        set({
          // snap.exists(): そのIDのドキュメントが実際に存在するか。
          // 削除済み投稿のURLに直接アクセスされた場合などはfalseになるので、
          // 「見つかりませんでした」表示に使えるよう null を入れておく。
          currentPost: snap.exists()
            ? {
                id: snap.id,
                ...snap.data(),
                createdAt: snap.data().createdAt?.toDate(),
              }
            : null,
          currentPostLoading: false,
          currentPostUnsubscribe: unsub,
        });
      },
      (error) => {
        console.error('subscribeToPost error:', error);
        set({
          currentPost: null,
          currentPostLoading: false,
          currentPostUnsubscribe: null,
        });
      }
    );

    set({ currentPostUnsubscribe: unsub });
  },

  unsubscribeFromPost: () => {
    const { currentPostUnsubscribe } = get();
    if (currentPostUnsubscribe) currentPostUnsubscribe();
    set({
      currentPostUnsubscribe: null,
      currentPost: null,
      // 次に別の投稿詳細を開いたとき、前の投稿が一瞬見えないように
      // ローディング状態へ戻しておく
      currentPostLoading: true,
    });
  },

  // ==============================
  // コメント：リアルタイム購読（posts/{postId}/comments）
  // ==============================
  subscribeToComments: (postId) => {
    const { commentsUnsubscribe: prev } = get();
    if (prev) prev();

    set({ commentsLoading: true, comments: [] });

    // サブコレクションを対象にする場合、where()での絞り込みは不要。
    // 「posts/{postId}/comments」というパス自体が
    // 「この投稿のコメントだけ」という絞り込みを兼ねているため。
    // その結果 orderBy だけの単純なクエリになり、複合インデックスも要らない。
    const q = query(
      collection(db, 'posts', postId, 'comments'),
      orderBy('createdAt', 'asc') // コメントは会話の流れ通り、古い順に並べる
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const comments = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          createdAt: d.data().createdAt?.toDate(),
        }));
        set({ comments, commentsLoading: false, commentsUnsubscribe: unsub });
      },
      (error) => {
        console.error('subscribeToComments error:', error);
        set({ commentsLoading: false, commentsUnsubscribe: null });
      }
    );

    set({ commentsUnsubscribe: unsub });
  },

  unsubscribeFromComments: () => {
    const { commentsUnsubscribe } = get();
    if (commentsUnsubscribe) commentsUnsubscribe();
    set({ commentsUnsubscribe: null, comments: [] });
  },

  // ==============================
  // コメント追加 ＋ 親投稿のcommentCountを+1
  // ==============================
  // ここでやりたいことは2つ：
  //   1. posts/{postId}/comments に新しいコメントを作る
  //   2. posts/{postId} の commentCount を +1 する
  // これを addDoc と updateDoc に分けて書くと、片方だけ成功して
  // 片方が失敗する（通信断など）可能性がある。
  // → writeBatch を使い「両方まとめて成功 or 両方まとめて失敗」にする。
  addComment: async (
    postId,
    userId,
    userEmail,
    userName,
    userPhotoURL,
    content
  ) => {
    try {
      // batchに書き込みを積んでいく。commit()するまでは何も送信されない。
      const batch = writeBatch(db);

      // doc(collection(...)) を引数なしで呼ぶと、
      // 「まだ書き込んでいないが、IDだけは確定した新規ドキュメント参照」が作れる。
      // addDoc は「参照の作成＋書き込み」を同時に行う関数なのでバッチでは使えず、
      // このように参照を先に用意してから batch.set() する。
      const commentRef = doc(collection(db, 'posts', postId, 'comments'));
      batch.set(commentRef, {
        userId,
        userEmail: userEmail ?? '',
        userName: userName ?? '',
        userPhotoURL: userPhotoURL ?? '',
        content,
        createdAt: serverTimestamp(),
      });

      // 親投稿のコメント数を+1する。
      // increment(1) は「今の値に+1して」という命令をサーバーに送る仕組み。
      // 「読み取って→+1して→書き戻す」を自分で書かないので、
      // 2人が同時にコメントしても両方きちんとカウントされる。
      const postRef = doc(db, 'posts', postId);
      batch.update(postRef, { commentCount: increment(1) });

      // ここで初めてサーバーへ送信される
      await batch.commit();
    } catch (error) {
      console.error('Add comment error:', error);
      throw error;
    }
  },

  // ==============================
  // コメント削除 ＋ 親投稿のcommentCountを-1
  // ==============================
  deleteComment: async (postId, commentId) => {
    try {
      const batch = writeBatch(db);

      batch.delete(doc(db, 'posts', postId, 'comments', commentId));

      // 追加時と同じ考え方で、こちらは increment(-1)
      const postRef = doc(db, 'posts', postId);
      batch.update(postRef, { commentCount: increment(-1) });

      await batch.commit();
    } catch (error) {
      console.error('Delete comment error:', error);
      throw error;
    }
  },

  // ==============================
  // プロフィール：users/{uid} を最新化する（upsert）
  // ==============================
  // ★なぜ users コレクションが必要か
  //   これまで投稿(posts)には投稿者の名前・アイコンURLをコピーして持たせていた。
  //   表示が速くなる反面、
  //     - 一度も投稿していない人のプロフィールを表示できない
  //     - フォロー関係（15章）を保存する場所が無い
  //   という問題がある。そこで「ユーザー1人につき1ドキュメント」の
  //   users/{uid} を用意する。
  //
  // ★ドキュメントIDをuidそのものにするのがポイント。
  //   検索(query)しなくても doc(db, 'users', uid) だけで目的の1件に辿り着ける。
  //
  // ★upsert = update + insert。
  //   「無ければ作る、あれば更新する」を1つの処理で済ませたいので、
  //   updateDoc（存在しないとエラー）ではなく setDoc を使う。
  upsertProfile: async (user) => {
    try {
      await setDoc(
        doc(db, 'users', user.uid),
        {
          // ここで書き込むのは「認証（Auth）側が持っている情報」だけ。
          // 自己紹介や出身地はこの関数では触らない。
          displayName: user.displayName ?? '',
          email: user.email ?? '',
          photoURL: user.photoURL ?? '',
          updatedAt: serverTimestamp(),
        },
        // ★{ merge: true } が最重要。
        //   これが無いとドキュメント全体が丸ごと置き換えられ、
        //   ログインし直すたびに bio / location / following（15章）が
        //   毎回消えてしまう。
        //   merge: true なら「ここに書いたフィールドだけ上書き、
        //   それ以外の既存フィールドはそのまま」になる。
        { merge: true }
      );
    } catch (error) {
      console.error('Upsert profile error:', error);
    }
  },

  // ==============================
  // プロフィール：users/{uid} をリアルタイム購読
  // ==============================
  subscribeToProfileUser: (uid) => {
    const { profileUserUnsubscribe: prev } = get();
    if (prev) prev();

    set({ profileUserLoading: true, profileUser: null });

    const unsub = onSnapshot(
      doc(db, 'users', uid),
      (snap) => {
        set({
          // まだ一度もログイン（このハンズオンではユーザー切り替え）していない
          // ユーザーは users/{uid} ドキュメントを持たないので null になる
          profileUser: snap.exists() ? { id: snap.id, ...snap.data() } : null,
          profileUserLoading: false,
          profileUserUnsubscribe: unsub,
        });
      },
      (error) => {
        console.error('subscribeToProfileUser error:', error);
        set({
          profileUser: null,
          profileUserLoading: false,
          profileUserUnsubscribe: null,
        });
      }
    );

    set({ profileUserUnsubscribe: unsub });
  },

  unsubscribeFromProfileUser: () => {
    const { profileUserUnsubscribe } = get();
    if (profileUserUnsubscribe) profileUserUnsubscribe();
    set({
      profileUserUnsubscribe: null,
      profileUser: null,
      profileUserLoading: true,
    });
  },

  // ==============================
  // プロフィール編集（自己紹介・出身地・バナー画像）
  // ==============================
  // 編集できるのは「Authに紐づかない項目」だけにしている。
  // displayName / email / photoURL は upsertProfile が
  // ログインのたびに上書きするため、ここで編集しても意味がないから。
  updateProfileDetails: async (uid, { bio, location, bannerURL }) => {
    try {
      // ここでも merge: true。
      // 指定した3つ以外（displayNameやfollowingなど）を消さないため。
      await setDoc(
        doc(db, 'users', uid),
        {
          bio: bio ?? '',
          location: location ?? '',
          bannerURL: bannerURL ?? '',
        },
        { merge: true }
      );
    } catch (error) {
      console.error('Update profile details error:', error);
      throw error;
    }
  },

  // ==============================
  // 表示名/アイコンのフォールバック取得
  // ==============================
  // users/{uid} をまだ持っていないユーザー（一度もログイン＝ユーザー切り替えを
  // していない人）の表示名とアイコンを、そのユーザーの最新の投稿から拾ってくる。
  // DMの相手表示や会話一覧で「名前が空欄のまま」になるのを防ぐために使う。
  getUserDisplayFallback: async (uid) => {
    try {
      // リアルタイムで見張り続ける必要はなく、その場で1回わかれば十分なので
      // onSnapshot ではなく getDocs（1回きりの取得）を使う。
      const q = query(
        collection(db, 'posts'),
        where('userId', '==', uid),
        orderBy('createdAt', 'desc'),
        limit(1) // 最新の1件だけで足りる（表示名とアイコンが分かればよい）
      );
      const snapshot = await getDocs(q);
      // 1件も投稿が無ければ手がかりが無いので null を返す
      if (snapshot.empty) return null;

      const post = snapshot.docs[0].data();
      return {
        displayName: post.userName || '',
        photoURL: post.userPhotoURL || '',
      };
    } catch (error) {
      console.error('Get user display fallback error:', error);
      return null;
    }
  },
}));

export default useFirestoreStore;
