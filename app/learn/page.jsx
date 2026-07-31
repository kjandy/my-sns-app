'use client';
import { DevUserSwitcher } from '@/components/DevUserSwitcher';
import { PostRow } from '@/components/PostRow';
import { dummyPosts } from '@/lib/learn/dummyData';
import { useMockAuthStore } from '@/stores/mockAuthStore';
import Link from 'next/link';
import { useState } from 'react';

export default function LearnPage() {
  const [posts, setPosts] = useState(dummyPosts);
  const { user } = useMockAuthStore();
  return (
    <main className="mx-auto min-h-screen max-w-2xl border-x">
      <div className="border-b p-8" id="learnlist">
        <h1 className="text-xl font-bold mb-4">学習用プロトタイプページ</h1>
        <Link
          href="/learn/zustand/"
          className="my-3 block text-md font-bold text-primary underline underline-offset-4"
        >
          → 1.Zustandの基本
        </Link>
        <Link
          href="/learn/firestore/"
          className="my-3 block text-md font-bold text-primary underline underline-offset-4"
        >
          → 2.firestoreの基本（crud処理）
        </Link>
      </div>
      <div>
        {posts.map((post) => (
          <PostRow post={post} currentUserId={user.uid} key={post.id} />
        ))}
      </div>
      {/* ユーザー切り替え（今ログインしている人を表す） */}
      <DevUserSwitcher />
    </main>
  );
}
