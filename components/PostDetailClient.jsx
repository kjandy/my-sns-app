'use client';

import { dummyPosts } from '@/lib/learn/dummyData';
import Link from 'next/link';
import { useState } from 'react';
import { PostRow } from './PostRow';
import { useMockAuthStore } from '@/stores/mockAuthStore';

export const PostDetailClient = ({ postId }) => {
  const [posts, setPosts] = useState(dummyPosts);
  const post = posts.find((p) => p.id === postId);
  const { user } = useMockAuthStore();
  return (
    <main className="mx-auto min-h-screen max-w-2xl border-x">
      <div className="border-b p-4">
        <Link
          href="/"
          className="text-sm text-primary underline underline-offset-4"
        >
          ← タイムラインに戻る
        </Link>
      </div>
      <PostRow post={post} currentUserId={user.uid} />

      <div className="p-4 text-sm text-muted-foreground">
        本来はここにコメント一覧が続きます。
      </div>
    </main>
  );
};
