'use client';
import { PostRow } from '@/components/PostRow';
import { dummyPosts } from '@/lib/learn/dummyData';
import useFirestoreStore from '@/stores/firestoreStore';
import { useMockAuthStore } from '@/stores/mockAuthStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export const TopPageClient = () => {
  const { subscribeTimeline, timeline } = useFirestoreStore();
  const [posts, setPosts] = useState(dummyPosts);
  const { user } = useMockAuthStore();
  const router = useRouter();

  // ======================================
  // タイムライン購読：ログイン中 & 選択中のタブに応じてタイムライン切り替え
  // ======================================
  useEffect(() => {
    subscribeTimeline();
  }, [user?.uid]);

  // タイムラインデータ
  const currentTimeline = timeline;

  return (
    <main className="mx-auto min-h-screen max-w-2xl border-x">
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
    </main>
  );
};
