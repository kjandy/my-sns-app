'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { PostRow } from './PostRow';
// import { useMockAuthStore } from '@/stores/mockAuthStore';
import useFirestoreStore from '@/stores/firestoreStore';
import useAuthStore from '@/stores/authStore';

export const PostDetailClient = ({ postId }) => {
  // 変更点: 以前は dummyPosts（id: '1'〜'3'固定）を posts.find(p => p.id === postId) で検索していたが、
  // TopPageClient側は既にFirestoreの実タイムライン（onSnapshot）を表示するようになっており、
  // そこから渡ってくる postId はFirestoreのドキュメントID（例: "aB3xY..."）。
  // dummyPostsのidとは一致しないため post が undefined になり、
  // PostRow内の post.userId 参照でランタイムエラーになっていた。
  // → firestoreStoreに追加した getPost(postId) でFirestoreから該当ドキュメントを直接取得する方式に変更。
  const {
    currentPost,
    currentPostLoading,
    comments,
    commentsLoading,
    subscribeToPost,
    unsubscribeFromPost,
    subscribeToComments,
    unsubscribeFromComments,
    addComment,
    deleteComment,
    deletePost,
    toggleCommentLike,
    toggleCommentBad,
  } = useFirestoreStore();
  // fetchedId が postId と一致していない間は読み込み中とみなす
  // （以前はdummyPostsを同期的にuseStateへ入れていたため読み込み状態は不要だったが、
  // 　非同期取得になったことで loading / not-found の状態管理が必要になった）
  const [{ fetchedId, post }, setResult] = useState({
    fetchedId: null,
    post: null,
  });
  // const { user } = useMockAuthStore();
  const { user } = useAuthStore();

  // 投稿IDが変わるたびにFirestoreから該当の1件を取得する
  useEffect(() => {
    subscribeToPost(postId);
    return () => {
      unsubscribeFromPost();
    };
  }, [postId]);

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
      {currentPostLoading ? (
        <div className="p-4 text-sm text-muted-foreground">読み込み中...</div>
      ) : currentPost === null ? (
        <div className="p-4 text-sm text-muted-foreground">
          投稿が見つかりませんでした。
        </div>
      ) : (
        <PostRow post={currentPost} />
      )}

      <div className="p-4 text-sm text-muted-foreground">
        本来はここにコメント一覧が続きます。
      </div>
    </main>
  );
};
