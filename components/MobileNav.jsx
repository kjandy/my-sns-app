/**
 *
 * モバイル用のフッター固定ナビ（components/MobileNav.jsx）
 *
 * PC表示ではHeader内のナビを使うので、こちらは md 未満（スマホ幅）でのみ
 * 画面下部に固定表示する（md:hidden）。
 *
 * ★このコンポーネントが会話一覧を購読している理由
 *   MobileNav は ClientLayout の直下に置かれており、ページを移動しても
 *   マウントされ続ける。ここで subscribeConversations しておけば、
 *   アプリ内のどのページにいても未読バッジが最新に保たれる。
 *   （各ページで購読を張り直す必要がない）
 *
 */

'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Home, Mail, Search, User } from 'lucide-react';
// import useAuthStore from '@/stores/authStore';
// import useDmStore, { hasUnreadMessages } from '@/stores/dmStore';
import { useMockAuthStore } from '@/stores/mockAuthStore';

import { cn } from '@/lib/utils';

export const MobileNav = () => {
  // const { user } = useAuthStore();
  const { user } = useMockAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  // const { conversations, subscribeConversations, unsubscribeConversations } =
  //   useDmStore();

  // useEffect(() => {
  //   if (user?.uid) {
  //     subscribeConversations(user.uid);
  //   }
  //   return () => unsubscribeConversations();
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [user?.uid]);

  if (!user) return null;

  // 未読があるかどうかは、購読済みのデータからその場で計算する
  // const hasUnread = hasUnreadMessages(conversations, user.uid);
  const hasUnread = null;

  const navItem = (href, label, Icon, showBadge = false) => (
    <button
      key={href}
      type="button"
      onClick={() => router.push(href)}
      aria-label={label}
      className={cn(
        'flex flex-1 items-center justify-center py-3.5',
        // 今いるページのアイコンだけ濃い色にする
        pathname === href ? 'text-foreground' : 'text-muted-foreground'
      )}
    >
      <span className="relative inline-flex">
        <Icon className="size-7" />
        {/* 未読バッジ。absoluteでアイコンの右上に重ねる。
            ring-2 ring-background で背景との境目に細い縁を付け、
            アイコンに埋もれないようにしている */}
        {showBadge && (
          <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-destructive ring-2 ring-background" />
        )}
      </span>
    </button>
  );

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 flex border-t bg-background/95 backdrop-blur-md md:hidden">
      {navItem('/', 'ホーム', Home)}
      {navItem(`/profile/${user.uid}`, 'プロフィール', User)}
      {navItem('/messages', 'メッセージ', Mail, hasUnread)}
      {/* 検索: PC版Headerと同じく、遷移先が未実装のプレースホルダー */}
      <button
        type="button"
        aria-label="検索"
        className="flex flex-1 items-center justify-center py-3.5 text-muted-foreground"
      >
        <Search className="size-7" />
      </button>
    </nav>
  );
};
