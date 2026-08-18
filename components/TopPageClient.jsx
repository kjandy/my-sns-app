'use client';
import { PostRow } from '@/components/PostRow';
import useAuthStore from '@/stores/authStore';
// import { dummyPosts } from '@/lib/learn/dummyData';
import useFirestoreStore from '@/stores/firestoreStore';
// import { useMockAuthStore } from '@/stores/mockAuthStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from './ui/button';

export const TopPageClient = () => {
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
  // const [posts, setPosts] = useState(dummyPosts);
  // const { user } = useMockAuthStore();
  const { user, loading } = useAuthStore();
  const router = useRouter();

  // ======================================
  // タイムライン購読：ログイン中 & 選択中のタブに応じてタイムライン切り替え
  // ======================================
  useEffect(() => {
    if (!user) {
      // ログアウトしたら購読を解除し、表示していたデータも捨てる
      unsubscribeTimeline();
      resetTimeline();
      return;
    }
    subscribeTimeline();
  }, [user?.uid]);

  // タイムラインデータ
  const currentTimeline = timeline;

  return (
    <main className="mx-auto min-h-screen max-w-2xl border-x">
      {user ? (
        // -- ログイン済み：タイムライン
        <div>
          {currentTimeline.map((post) => (
            <PostRow
              onClick={() => router.push(`/post/${post.id}`)}
              post={post}
              currentUserId={user.uid}
              key={post.id}
              onAvatarClick={(useId) => router.push(`/profile/${useId}`)}
            />
          ))}
        </div>
      ) : (
        // ── 未ログイン：タイムラインの代わりにサービス紹介のランディングを出す ──
        // ここでいきなり router.push('/login') しないのがポイント。
        // 「まず何のアプリかを見せてから、ボタンで能動的にログインへ進んでもらう」
        // という導線にしている（いきなりログイン画面に飛ばすより離脱されにくい）。
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center md:px-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold tracking-tight">
              いま、起きていること
            </h1>
            <p className="text-lg text-muted-foreground">
              MyAppに登録して、みんなの投稿をチェックしよう。
            </p>
          </div>

          <Button
            size="lg"
            className="w-full max-w-xs"
            onClick={() => router.push('/login')}
          >
            無料で始める
          </Button>
        </div>
      )}
    </main>
  );
};
