'use client';
import { PostRow } from '@/components/PostRow';
import { dummyPosts } from '@/lib/learn/dummyData';
import { useMockAuthStore } from '@/stores/mockAuthStore';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function TopPage() {
  const [posts, setPosts] = useState(dummyPosts);
  const { user } = useMockAuthStore();
  const router = useRouter();
  return (
    <main className="mx-auto min-h-screen max-w-2xl border-x">
      <div>
        {posts.map((post) => (
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
}
