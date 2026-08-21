/**
 *
 * TOPページのクライアント部分（components/TopPageClient.jsx）
 *
 * 「（全体タイムライン）／フォロー中」の2タブ構成にした。
 * あわせて、下までスクロールすると続きを読み込む無限スクロールも入れている。
 *
 */

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PostRow } from "@/components/PostRow";
import useFirestoreStore from "@/stores/firestoreStore";
import useSocialStore from "@/stores/socialStore";
// import { useMockAuthStore } from "@/stores/mockAuthStore"; // 17章で useAuthStore に差し替わる
import { cn } from "@/lib/utils";
import useAuthStore from "@/stores/authStore";

export const TopPageClient = () => {
  // const { user } = useMockAuthStore();
  const { user } = useAuthStore();
  const {
    timeline,
    timelineLoading,
    timelineHasMore,
    subscribeTimeline,
    unsubscribeTimeline,
    loadMoreTimeline,
    resetTimeline,
    followingTimeline,
    followingTimelineLoading,
    followingTimelineHasMore,
    subscribeFollowingTimeline,
    unsubscribeFollowingTimeline,
    loadMoreFollowingTimeline,
    resetFollowingTimeline,
  } = useFirestoreStore();
  const { following, subscribeMyFollowing, unsubscribeMyFollowing } =
    useSocialStore();

  const router = useRouter();
  // 無限スクロールの「見張り対象」にするDOM要素への参照
  const loadMoreRef = useRef(null);

  // 'public' = おすすめ（全体） / 'following' = フォロー中
  const [activeTab, setActiveTab] = useState("public");

  // 「フォロー中」タブで絞り込みに使うuidの一覧。
  // 自分の投稿もタイムラインに出したいので、自分のuidを足している。
  // Setに通しているのは、万が一自分をフォローしていても重複させないため。
  //
  // useMemo で包んでいるのは、毎回新しい配列が作られると
  // 下のuseEffectが無限に再実行されてしまうため。
  const followingUids = useMemo(() => {
    if (!user) return [];
    return Array.from(new Set([...following, user.uid]));
  }, [following, user]);

  // ==================================================
  // 自分のfollowing一覧を購読（フォロー中タブの絞り込み用）
  // ==================================================
  useEffect(() => {
    if (user?.uid) {
      subscribeMyFollowing(user.uid);
    }
    return () => unsubscribeMyFollowing();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  // ==================================================
  // タイムライン購読：選択中のタブに応じて切り替える
  // ==================================================
  useEffect(() => {
    if (!user) {
      unsubscribeTimeline();
      unsubscribeFollowingTimeline();
      resetTimeline();
      resetFollowingTimeline();
      return;
    }

    if (activeTab === "public") {
      subscribeTimeline();
    } else {
      subscribeFollowingTimeline(followingUids);
    }

    // タブを切り替えたときにも必ず前の購読を解除する。
    // 解除しないと、裏で見えていないタイムラインの購読が動き続ける。
    return () => {
      unsubscribeTimeline();
      unsubscribeFollowingTimeline();
    };
    // 配列そのものを依存配列に入れると毎回「別物」と判定されるため、
    // join(',')で文字列にして中身が変わったときだけ反応させる
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, activeTab, followingUids.join(",")]);

  // 表示中のタブに応じたデータを1か所でまとめて選ぶ。
  // こうしておくと、下のJSXではタブの分岐を書かなくて済む。
  const currentTimeline = activeTab === "public" ? timeline : followingTimeline;
  const currentLoading =
    activeTab === "public" ? timelineLoading : followingTimelineLoading;
  const currentHasMore =
    activeTab === "public" ? timelineHasMore : followingTimelineHasMore;

  const handleLoadMore = () => {
    if (activeTab === "public") {
      loadMoreTimeline();
    } else {
      loadMoreFollowingTimeline(followingUids);
    }
  };

  // ==================================================
  // 無限スクロール
  // ==================================================
  // IntersectionObserver は「指定した要素が画面内に入ったか」を
  // 監視してくれるブラウザの標準機能。
  // スクロールイベントを自前で拾うより軽く、正確。
  useEffect(() => {
    if (!user || !currentHasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // isIntersecting = 監視対象が画面に入った
        if (entries[0].isIntersecting && !currentLoading) {
          handleLoadMore();
        }
      },
      { threshold: 0.1 }, // 10%見えたら発火
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    // 監視の解除も忘れずに（onSnapshotのunsubscribeと同じ考え方）
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, activeTab, currentHasMore, currentLoading]);

  const tabButtonClass = (tab) =>
    cn(
      "-mb-px flex-1 border-b-2 py-4 text-center text-[15px] font-bold transition-colors hover:bg-muted/40",
      activeTab === tab
        ? "border-primary text-foreground"
        : "border-transparent text-muted-foreground",
    );

  return (
    <main className="mx-auto min-h-screen max-w-2xl border-x">
      {/* タブ切り替え。top-14 はヘッダー(h-14)の高さ分だけ下げてsticky固定するため */}
      <div className="sticky top-14 z-40 flex border-b bg-background/80 backdrop-blur-md">
        <button
          type="button"
          onClick={() => setActiveTab("public")}
          className={tabButtonClass("public")}
        >
          おすすめ
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("following")}
          className={tabButtonClass("following")}
        >
          フォロー中
        </button>
      </div>

      {currentTimeline.length === 0 && !currentLoading ? (
        <div className="px-4 py-16 text-center text-muted-foreground md:px-8">
          {activeTab === "public" ? (
            <>
              <p className="text-lg font-semibold">まだ投稿がありません</p>
              <p className="mt-2 text-sm">最初の投稿を作成してみましょう！</p>
            </>
          ) : (
            <>
              <p className="text-lg font-semibold">
                フォロー中のユーザーの投稿がありません
              </p>
              <p className="mt-2 text-sm">
                気になるユーザーをフォローしてみましょう！
              </p>
            </>
          )}
        </div>
      ) : (
        <div>
          {currentTimeline.map((post) => (
            <PostRow
              key={post.id}
              post={post}
              // PostRowに渡すのは post と onClick だけ。
              // 「今ログインしているのは誰か」「いいねをどう書き込むか」は
              // PostRowの内部で完結するため、ここでは渡さない。
              onClick={() => router.push(`/post/${post.id}`)}
            />
          ))}

          {/* 無限スクロールのトリガー。
              この要素が画面に入った瞬間に次の10件を読み込む */}
          {currentHasMore && (
            <div ref={loadMoreRef} className="py-4 text-center">
              <div className="text-sm text-muted-foreground">
                {currentLoading ? "読み込み中..." : "スクロールして続きを読む"}
              </div>
            </div>
          )}

          {!currentHasMore && currentTimeline.length > 0 && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              これ以上の投稿はありません
            </div>
          )}
        </div>
      )}
    </main>
  );
};
