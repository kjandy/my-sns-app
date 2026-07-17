import { dummyPosts } from '@/lib/learn/dummyData';
import { useState } from 'react';

export const PostDetailClient = ({ postId }) => {
  const [posts, setPosts] = useState(dummyPosts);
  const post = posts.find((p) => p.id === postId);
  return (
    <>
      <h1>投稿詳細ページ</h1>
    </>
  );
};
