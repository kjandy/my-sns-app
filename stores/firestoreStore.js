/**
 *
 *
 * Zustand Store (stores/firestoreStore.js)
 *
 */

import { db } from '@/lib/firebase';
import {
  addDoc,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';
import { create } from 'zustand';

const useFirestoreStore = create((set, get) => ({
  // --- State ---
  posts: [],
  loading: true,
  error: null,
  unsubscribe: null, // 自分の投稿監視用

  // タイムライン用State
  timeline: [],
  timelineLoading: false,
  timelineHasMore: true,
  timelineLastDoc: null, // ページング（追加読込み）の起点「直近で取得した最後のドキュメント」
  timelineUnsubscribe: null, // タイムライン購読解除（リアルタイム）

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
      timelineLoading: false,
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

  // ==============================
  // 投稿を追加
  // ==============================
  addPost: async (userId, userEmail, userName, userPhotoURL, content) => {
    // console.log(userId, userEmail, userName, userPhotoURL, content);
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
}));

export default useFirestoreStore;
