'use client';
import { PostRow } from '@/components/PostRow';
import { dummyPosts } from '@/lib/learn/dummyData';
import { useMockAuthStore } from '@/stores/mockAuthStore';
import { useState } from 'react';

export default function LearnPage() {
  const [posts, setPosts] = useState(dummyPosts);
  const { user } = useMockAuthStore();
  return (
    <main className="mx-auto min-h-screen max-w-2xl border-x">
      <div>
        {posts.map((post) => (
          <PostRow post={post} currentUserId={user.uid} key={post.id} />
        ))}
      </div>
    </main>
  );
}
