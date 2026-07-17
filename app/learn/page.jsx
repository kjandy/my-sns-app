'use client';
import { DevUserSwitcher } from '@/components/DevUserSwitcher';
import { PostRow } from '@/components/PostRow';
import { dummyPosts } from '@/lib/learn/dummyData';
import { useMockAuthStore } from '@/stores/mockAuthStore';
import { useState } from 'react';

export default function LearnPage() {
  const [posts, setPosts] = useState(dummyPosts);
  const { user } = useMockAuthStore();
  return (
    <>
      <div>
        {posts.map((post) => (
          <PostRow post={post} currentUserId={user.uid} key={post.id} />
        ))}
      </div>
      {/* ユーザー切り替え（今ログインしている人を表す） */}
      <DevUserSwitcher />
    </>
  );
}
