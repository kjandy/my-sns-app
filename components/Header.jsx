'use client';

import { LogOut, Search } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { usePathname, useRouter } from 'next/navigation';
import { useMockAuthStore } from '@/stores/mockAuthStore';

export const Header = () => {
  // const { user, loading, signOut } = useAuthStore();
  const { user } = useMockAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const getInitials = (email) => {
    if (!email) return '?';
    return email.charAt(0).toUpperCase();
  };

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
                  onClick={handleSignOut}
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
                onClick={handleSignOut}
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
};
