'use client';
import { DevUserSwitcher } from '@/components/learn/DevUserSwitcher';
import { PostRow } from '@/components/learn/PostRow';
import { dummyPosts } from '@/lib/learn/dummyData';
import { useState } from 'react';

export default function LearnPage() {
  const [posts, setPosts] = useState(dummyPosts);
  return (
    <>
      <div>
        {posts.map((post) => (
          <PostRow post={post} key={post.id} />
        ))}
      </div>
      {/* ユーザー切り替え（今ログインしている人を表す） */}
      <DevUserSwitcher />
    </>
  );
}
