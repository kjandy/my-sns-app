/**
 *
 * フォロー機能の Zustand Store（stores/socialStore.js）
 *
 * ★この章はデータモデルの決め方が9割
 *
 *   採用した設計：
 *     users/{uid} ドキュメントに following: string[]
 *     （＝自分がフォローしている相手のuidの配列）を持たせる
 *
 *   一見、「フォローされる側」に followers 配列を持たせたくなる。
 *   しかしそれだと「Aさんがフォローする」＝「Bさんのドキュメントを書き換える」
 *   ことになり、14章で決めた
 *       allow write: if request.auth.uid == userId （本人のドキュメントのみ）
 *   というシンプルなルールが成立しなくなる。
 *
 *   following 方式なら、フォロー／アンフォローは常に
 *   「自分のドキュメントの配列を自分で書き換える」だけで完結する。
 *   → 15章でFirestoreルールの追加が一切不要なのは、この設計のおかげ。
 *
 *   データモデルの工夫が、そのままセキュリティルールの単純さに直結する
 *   という良い例。
 *
 */

import { create } from "zustand";
import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

const useSocialStore = create((set, get) => ({
  // --- State ---
  following: [], // 「今ログインしている自分」がフォローしているuidの配列
  followingLoading: true,
  followingUnsubscribe: null,

  followerCount: 0, // 「今表示しているプロフィール」のフォロワー数
  followerCountLoading: true,
  followerCountUnsubscribe: null,

  // ==============================
  // 自分の following 配列をリアルタイム購読
  // ==============================
  // フォローボタンの「フォロー中／フォロー」の出し分けと、
  // 「フォロー中」タイムラインの絞り込みの両方でこの配列を使う。
  subscribeMyFollowing: (myUid) => {
    const { followingUnsubscribe: prev } = get();
    if (prev) prev();

    set({ followingLoading: true });

    const unsub = onSnapshot(
      doc(db, "users", myUid),
      (snap) => {
        set({
          // まだ一度もフォローしていない場合、followingフィールド自体が
          // 存在しないので、その場合は空配列にフォールバックする
          following: snap.exists() ? snap.data().following || [] : [],
          followingLoading: false,
          followingUnsubscribe: unsub,
        });
      },
      (error) => {
        console.error("subscribeMyFollowing error:", error);
        set({
          following: [],
          followingLoading: false,
          followingUnsubscribe: null,
        });
      },
    );

    set({ followingUnsubscribe: unsub });
  },

  unsubscribeMyFollowing: () => {
    const { followingUnsubscribe } = get();
    if (followingUnsubscribe) followingUnsubscribe();
    set({
      followingUnsubscribe: null,
      following: [],
      followingLoading: true,
    });
  },

  // ==============================
  // 表示中プロフィールのフォロワー数をリアルタイム購読
  // ==============================
  // ★「フォロワー数」という専用フィールドは持たせていない。
  //   users コレクション全体から
  //   「following 配列に このuid を含むドキュメント」を検索し、
  //   その件数(snapshot.size)をそのままフォロワー数として使う。
  //
  //   専用フィールドを持たせると、フォロー/アンフォローのたびに
  //   相手側の followerCount を +1 / -1 する処理が必要になり、
  //   「他人のドキュメントに書き込む」ことになってしまう（＝上のコメント参照）。
  //
  //   代わりに、フォロワーが非常に多いユーザーではこのクエリが重くなるが、
  //   学習用アプリの規模では問題にならない。
  subscribeFollowerCount: (uid) => {
    const { followerCountUnsubscribe: prev } = get();
    if (prev) prev();

    set({ followerCountLoading: true });

    // array-contains: 「配列フィールドの中に、この値が含まれるか」で絞り込む演算子
    const q = query(
      collection(db, "users"),
      where("following", "array-contains", uid),
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        set({
          followerCount: snapshot.size, // 該当ドキュメントの件数＝フォロワー数
          followerCountLoading: false,
          followerCountUnsubscribe: unsub,
        });
      },
      (error) => {
        console.error("subscribeFollowerCount error:", error);
        set({
          followerCount: 0,
          followerCountLoading: false,
          followerCountUnsubscribe: null,
        });
      },
    );

    set({ followerCountUnsubscribe: unsub });
  },

  unsubscribeFollowerCount: () => {
    const { followerCountUnsubscribe } = get();
    if (followerCountUnsubscribe) followerCountUnsubscribe();
    set({
      followerCountUnsubscribe: null,
      followerCount: 0,
      followerCountLoading: true,
    });
  },

  // ==============================
  // フォロー / アンフォロー
  // ==============================
  // 12章のいいねで使った arrayUnion / arrayRemove が、そのまま同じ形で登場する。
  // 「配列にuidをトグルする」操作は、いいね・Bad・フォローと
  // このアプリの至るところで繰り返し出てくるパターン。
  follow: async (myUid, targetUid) => {
    try {
      // 書き込み先は常に自分のドキュメント（myUid）。相手のドキュメントは触らない
      await updateDoc(doc(db, "users", myUid), {
        following: arrayUnion(targetUid),
      });
    } catch (error) {
      console.error("Follow error:", error);
      throw error;
    }
  },

  unfollow: async (myUid, targetUid) => {
    try {
      await updateDoc(doc(db, "users", myUid), {
        following: arrayRemove(targetUid),
      });
    } catch (error) {
      console.error("Unfollow error:", error);
      throw error;
    }
  },
}));

export default useSocialStore;
