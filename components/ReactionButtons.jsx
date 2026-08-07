/**
 *
 * いいね / Bad ボタン（components/ReactionButtons.jsx）
 *
 * 「投稿」にも「コメント」にも同じ見た目・同じ操作感で使いたいので、
 * リアクション部分だけを独立したコンポーネントとして切り出している。
 *
 * ★このコンポーネントの一番大事な性質：
 *   Firestoreも、ログインユーザーのストア（mockAuthStore）も、一切importしていない。
 *   受け取るのは
 *     - likedBy / badBy … 「誰が押したか」のuid配列（ただのデータ）
 *     - currentUserId   … 「今の自分は誰か」のuid（ただの文字列）
 *     - onToggleLike / onToggleBad … 押されたときに呼ぶ関数（ただのコールバック）
 *   だけ。
 *
 *   つまり「何に対するリアクションなのか（投稿？コメント？）」を
 *   このコンポーネント自身は知らない。知っているのは呼び出し側だけ。
 *   だからこそ、13章でコメントのいいねを作るときに1行も書き換えずに再利用できる。
 *
 */

'use client';

import { Heart, ThumbsDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ReactionButtons = ({
  likedBy = [], // いいねした人のuid配列。まだ誰も押していない投稿にはフィールド自体が
  badBy = [], // 無いことがあるので、デフォルト値の空配列で受け止める
  currentUserId,
  onToggleLike,
  onToggleBad,
  size = 'default', // 'sm' を渡すとアイコンが一回り小さくなる（コメント用）
}) => {
  // 「自分が既に押しているか」は、配列に自分のuidが含まれるかどうかで判定する。
  // currentUserIdがundefined（未ログイン相当）のときは常にfalse扱いにする。
  const isLiked = currentUserId ? likedBy.includes(currentUserId) : false;
  const isBad = currentUserId ? badBy.includes(currentUserId) : false;

  const iconSize = size === 'sm' ? 'size-3.5' : 'size-4';

  // e.stopPropagation() が重要。
  // このボタンは PostRow（記事全体に「投稿詳細へ遷移する」onClickが付いている）の
  // 内側にあるため、止めないとクリックが親まで伝わって、いいねを押したつもりが
  // ページ遷移してしまう。
  const handleLike = (e) => {
    e.stopPropagation();
    // onToggleLike?.() のオプショナル呼び出しにしているのは、
    // 「表示だけしたい（押せなくてよい）」場面でも同じコンポーネントを使えるようにするため。
    // 引数として「押す前の状態」を渡すので、呼び出し側は
    // 「今いいね済みなら外す／まだなら付ける」を判断できる。
    onToggleLike?.(isLiked);
  };

  const handleBad = (e) => {
    e.stopPropagation();
    onToggleBad?.(isBad);
  };

  return (
    <div className="flex items-center gap-4">
      {/* いいね（ハート） */}
      <button
        type="button"
        onClick={handleLike}
        className={cn(
          'flex items-center gap-1.5 rounded-full px-1.5 py-1 text-sm transition-colors hover:bg-destructive/10 hover:text-destructive',
          // 押し済みなら赤系の色で「押している」ことを伝える
          isLiked ? 'text-destructive' : 'text-muted-foreground'
        )}
        aria-label="いいね"
      >
        {/* fill-current: 押し済みのときだけアイコンを塗りつぶす（輪郭だけ→塗り） */}
        <Heart className={cn(iconSize, isLiked && 'fill-current')} />
        {/* 0件のときは数字を出さない（Twitter等と同じ挙動で、画面がすっきりする） */}
        {likedBy.length > 0 && <span>{likedBy.length}</span>}
      </button>

      {/* Bad（サムズダウン） */}
      <button
        type="button"
        onClick={handleBad}
        className={cn(
          'flex items-center gap-1.5 rounded-full px-1.5 py-1 text-sm transition-colors hover:bg-muted hover:text-foreground',
          isBad ? 'text-foreground' : 'text-muted-foreground'
        )}
        aria-label="Bad"
      >
        <ThumbsDown className={cn(iconSize, isBad && 'fill-current')} />
        {badBy.length > 0 && <span>{badBy.length}</span>}
      </button>
    </div>
  );
};
