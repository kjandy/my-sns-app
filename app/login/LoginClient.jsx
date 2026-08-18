'use client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import useAuthStore from '@/stores/authStore';
import { div } from 'motion/react-client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export const LoginClient = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { user, loading, error, signIn, signUp, signInWithGoogle } =
    useAuthStore();
  const router = useRouter();
  // 既にログイン済みならタイムラインへ戻す。
  //
  // ★この判定をサーバー側（page.jsx）ではなくここで行っている理由
  //   サーバー側でCookieだけを見て判定すると、
  //   「Cookieは残っているがクライアントは未ログイン」という状態のときに
  //   /login へ来るたび / へ飛ばされ、ログイン画面に二度とたどり着けなくなる。
  //   実際のFirebase認証状態（onAuthStateChanged の結果）を見るこちらで
  //   判定する方が安全。
  useEffect(() => {
    if (!loading && user) {
      router.push('/');
    }
  }, [user, loading, router]);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signIn(email, password);
      router.push('/');
    } catch {
    } finally {
      setIsLoading(false);
    }
  };
  const handleSignUp = async () => {
    setIsLoading(true);
    try {
      await signUp(email, password, displayName);
      router.push('/');
    } catch {
    } finally {
      setIsLoading(false);
    }
  };
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
      router.push('/');
    } catch {
    } finally {
      setIsLoading(false);
    }
  };
  // 認証状態の判定中は何も出さない
  // これがないと、ログイン済みの人にも一瞬ログインフォームが見えてしまう。
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-muted-foreground">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-56px)] items-center justify-center p-4">
      <Card className="w-full max-w-md border-none shadow-none sm:border sm:shadow-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-center text-2xl font-bold">
            ログイン
          </CardTitle>
          <CardDescription className="text-center">
            アカウントにログインしてください
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Googleログイン。ポップアップが開くだけで、フォーム入力は不要 */}
          <Button
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Googleでログイン
          </Button>

          {/* 「または」の区切り線。
              絶対配置の横線の上に、背景色を敷いた文字を重ねて作る */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                または
              </span>
            </div>
          </div>

          {/* メール / パスワード */}
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">ユーザー名（新規登録時）</Label>
              <Input
                id="displayName"
                placeholder="例：Koji"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                ※メール/パスワードで登録する場合に使用します
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <Input
                id="password"
                type="password"
                placeholder="6文字以上"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                disabled={isLoading}
              />
            </div>

            {/* authStoreに入っているエラーメッセージを表示 */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              {/* type="submit" はフォーム送信＝ログイン */}
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading ? 'ログイン中...' : 'ログイン'}
              </Button>
              {/* 新規登録は type="button" にして、フォーム送信を発火させない */}
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handleSignUp}
                disabled={isLoading}
              >
                新規登録
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
