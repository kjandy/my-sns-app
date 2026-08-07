// ============================================
// 7. ヘッダー (components/Header.jsx)
// ============================================
'use client';
import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
// import useAuthStore from '@/stores/authStore';
import { useMockAuthStore } from '@/stores/mockAuthStore';

// import useDmStore, { hasUnreadMessages } from '@/stores/dmStore';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Home, User, LogOut, Search, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Header() {
  // const { user, loading, signOut } = useAuthStore();
  const { user } = useMockAuthStore();
  // const { conversations } = useDmStore();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    // const result = await signOut();
    // if (!result.success) {
    //   // Cookie削除に失敗した場合はログイン状態のままなので、
    //   // メニューを閉じたり/へ遷移したりせず、その場でエラーを伝える。
    //   // （stores/authStore.jsのsignOut()コメント参照）
    //   window.alert(result.error);
    //   return;
    // }
    // setMenuOpen(false);
    // router.push('/');
  };

  const getInitials = (email) => {
    if (!email) return '?';
    return email.charAt(0).toUpperCase();
  };

  // if (loading) return null;

  // const hasUnread = user ? hasUnreadMessages(conversations, user.uid) : false;
  const hasUnread = false;

  // アイコンの右上に小さい丸バッジを重ねる（未読メッセージがある時だけ）
  const iconWithBadge = (Icon, size, showBadge) => (
    <span className="relative inline-flex">
      <Icon className={size} />
      {showBadge && (
        <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-destructive ring-2 ring-background" />
      )}
    </span>
  );

  // PC表示のナビゲーションボタンを生成するヘルパー関数
  // 呼び出し側で毎回同じJSX構造を書かずに済むよう、
  // href/label/Icon/バッジ有無を渡すだけでボタン1個分のJSXを返す
  const navItem = (href, label, Icon, showBadge = false) => (
    <Button
      variant="ghost"
      size="lg"
      // 現在のページ(pathname)とこのボタンの遷移先(href)が一致するかで見た目を出し分け
      // 一致＝今見ているページ → 文字色を強調(text-foreground)して「今ここにいる」ことを示す
      // 不一致＝別のページへのリンク → 薄いグレー(text-muted-foreground)にし、
      //   ホバー時だけ強調色に変化させる(hover:text-foreground)
      className={
        pathname === href
          ? 'gap-2 text-foreground'
          : 'gap-2 text-muted-foreground hover:text-foreground'
      }
      // クリックでNext.jsのrouter.pushによりページ遷移
      // <a>タグではなくbuttonなのは、Button自体がクリック領域を持つコンポーネントのため
      onClick={() => router.push(href)}
    >
      {/* アイコン本体。showBadgeがtrueの時だけ右上に未読バッジ(小さい丸)を重ねて表示する
          (iconWithBadgeの定義は上のconst参照。メッセージ未読時などに使う) */}
      {iconWithBadge(Icon, 'size-6', showBadge)}
      {/* ラベル文字列はスマホ幅(sm未満)では非表示にし、アイコンのみのミニマルな表示にする
          sm以上(タブレット・PC)になったら"inline"でアイコンの横に表示する */}
      <span className="hidden sm:inline">{label}</span>
    </Button>
  );

  // 左ドロワー内のリンク項目（アイコン+ラベルの横並びボタン）
  const menuLink = (href, label, Icon, showBadge = false) => (
    <button
      type="button"
      onClick={() => {
        setMenuOpen(false);
        router.push(href);
      }}
      className={cn(
        'flex items-center gap-4 rounded-md px-3 py-3 text-left text-lg font-medium transition-colors hover:bg-accent',
        pathname === href ? 'text-foreground' : 'text-muted-foreground'
      )}
    >
      {iconWithBadge(Icon, 'size-7', showBadge)}
      {label}
    </button>
  );

  // 検索: 遷移先ページが未実装のためリンクではなくプレースホルダー表示
  const menuSearchPlaceholder = (
    <button
      type="button"
      className="flex items-center gap-4 rounded-md px-3 py-3 text-left text-lg font-medium text-muted-foreground transition-colors hover:bg-accent"
    >
      <Search className="size-7" />
      検索
    </button>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 md:px-8">
        {/* サイトID部分: ログインユーザーのアイコン（未ログイン時は"K"） */}
        {/* タップすると左からリンクリストのドロワーが開く */}
        <button
          onClick={() => setMenuOpen(true)}
          className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-lg font-bold text-primary-foreground transition-opacity hover:opacity-90"
          aria-label="メニューを開く"
        >
          {user ? (
            <Avatar className="size-11">
              {user.photoURL ? (
                <AvatarImage src={user.photoURL} alt={user.email} />
              ) : null}
              <AvatarFallback className="bg-primary text-base font-bold text-primary-foreground">
                {getInitials(user.email)}
              </AvatarFallback>
            </Avatar>
          ) : (
            'K'
          )}
        </button>

        {/* ナビゲーション＋ログイン情報 */}
        <nav className="flex items-center gap-1">
          {user ? (
            <>
              {/* ホーム/プロフィールはPC表示のみ。モバイルはMobileNav(下部固定)に移動 */}
              <div className="hidden items-center gap-1 md:flex">
                {navItem('/', 'ホーム', Home)}
                {navItem(`/profile/${user.uid}`, 'プロフィール', User)}
                {navItem('/messages', 'メッセージ', Mail, hasUnread)}
              </div>

              <div className="ml-2 flex items-center gap-1 border-l pl-2">
                {/* 検索: PC表示のみ。モバイルはMobileNav(Footer)側に配置 */}
                <Button
                  variant="ghost"
                  size="icon-lg"
                  className="hidden md:inline-flex"
                  aria-label="検索"
                >
                  <Search className="size-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-lg"
                  // onClick={handleSignOut}
                  aria-label="ログアウト"
                >
                  <LogOut className="size-6" />
                </Button>
              </div>
            </>
          ) : (
            <Button size="sm" onClick={() => router.push('/login')}>
              ログイン
            </Button>
          )}
        </nav>
      </div>

      {/* 左ドロワー: アカウント情報 + リンクリスト */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-72">
          <SheetHeader>
            <SheetTitle className="sr-only">メニュー</SheetTitle>
            <SheetDescription className="sr-only">
              アカウント情報とナビゲーションリンクの一覧
            </SheetDescription>

            <button
              type="button"
              onClick={() => {
                if (!user) return;
                setMenuOpen(false);
                router.push(`/profile/${user.uid}`);
              }}
              className="flex items-center gap-3 text-left disabled:cursor-default"
              disabled={!user}
            >
              <Avatar className="size-16">
                {user?.photoURL ? (
                  <AvatarImage src={user.photoURL} alt={user.email} />
                ) : null}
                <AvatarFallback className="bg-primary text-2xl font-bold text-primary-foreground">
                  {user ? getInitials(user.email) : 'K'}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold">
                  {user ? user.displayName || user.email : 'ゲスト'}
                </p>
                {user && (
                  <p className="truncate text-sm text-muted-foreground">
                    {user.email}
                  </p>
                )}
              </div>
            </button>
          </SheetHeader>

          <nav className="flex flex-col gap-1 px-2">
            {menuLink('/', 'ホーム', Home)}
            {user && menuLink(`/profile/${user.uid}`, 'プロフィール', User)}
            {user && menuLink('/messages', 'メッセージ', Mail, hasUnread)}
            {menuSearchPlaceholder}
          </nav>

          <SheetFooter>
            {user ? (
              <Button
                variant="outline"
                className="justify-start gap-3"
                // onClick={handleSignOut}
              >
                <LogOut className="size-4" />
                ログアウト
              </Button>
            ) : (
              <Button
                onClick={() => {
                  setMenuOpen(false);
                  router.push('/login');
                }}
              >
                ログイン
              </Button>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </header>
  );
}
