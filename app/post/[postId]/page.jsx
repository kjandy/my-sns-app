/**
 *
 * 投稿詳細ページ
 *
 */

import { PostDetailClient } from '@/components/PostDetailClient';

export default async function PostDetailPage({ params }) {
  const { postId } = await params;
  return <PostDetailClient postId={postId} />;
}
