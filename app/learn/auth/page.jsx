// ============================================
// Firebase Authentication 学習用ページ (app/learn/auth/page.jsx)
//
// このページの目的: Zustand（stores/authStore.js）やサーバー側のセッション
// Cookie（lib/auth-actions.js）を一切使わず、useState + useEffect だけで
// Firebase Authenticationの基本2操作
// （メール/パスワード認証・Googleログイン）を体験すること。
//
// 本編（app/login）との違い:
// - サーバーにIDトークンを送ってセッションCookieを作る処理は行わない
//   （ページを再読み込みするとログイン状態はブラウザ側のFirebase SDKが
//     復元してくれるが、サーバー側の保護は無い＝学習用の簡易版）
// - ログイン後にFirestoreの users コレクションへプロフィールを保存する
//   処理（upsertProfile）も行わない。あくまでAuthenticationの動きだけに絞る
// ============================================
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// 主要なエラーコードだけを日本語化する簡易版。
// 本編(stores/authStore.js の getAuthErrorMessage)はもっと多くのコードを
// 網羅しているが、ここでは学習に必要な最小限だけに絞っている。
function toJapaneseMessage(code) {
  const messages = {
    'auth/invalid-email': 'メールアドレスの形式が正しくありません',
    'auth/invalid-credential': 'メールアドレスまたはパスワードが間違っています',
    'auth/email-already-in-use': 'このメールアドレスは既に使用されています',
    'auth/weak-password': 'パスワードが弱すぎます。6文字以上にしてください',
    'auth/popup-blocked': 'ポップアップがブロックされました',
  };
  return messages[code] || `認証エラー: ${code}`;
}

export default function LearnAuthPage() {
  // 現在ログイン中のユーザー。Firebaseの User オブジェクトそのものが入る。
  // 未ログインなら null。
  const [user, setUser] = useState(null);
  // 初回のログイン状態確認が終わるまでの読み込み中フラグ。
  const [loading, setLoading] = useState(true);

  // メール/パスワード用の入力欄
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // 直近の操作で失敗したときのエラーメッセージ
  const [error, setError] = useState('');

  // ============================================
  // ログイン状態のリアルタイム監視
  // ============================================
  useEffect(() => {
    // onAuthStateChanged: Firestoreの onSnapshot(05章) とよく似た仕組み。
    // 一度呼んで終わりではなく、ログイン/ログアウトが起きるたびに、そして
    // ページを開き直したときの「ログイン状態の復元」が終わったタイミングでも
    // 自動でコールバックが呼び直される「認証状態のリアルタイム購読」。
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      // currentUser はログイン中ならUserオブジェクト、未ログインならnull
      setUser(currentUser);
      setLoading(false);
    });

    // クリーンアップ関数: onSnapshotのunsubscribeと全く同じ考え方。
    // このページを離れるときに監視を止める。
    return () => unsubscribe();
  }, []);

  // ============================================
  // メール/パスワードでログイン
  // ============================================
  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    try {
      // signInWithEmailAndPassword: 既に登録済みのメール/パスワードで
      // ログインする。成功すると上のonAuthStateChangedが自動で発火し、
      // userが更新される（ここで直接setUserする必要はない）。
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(toJapaneseMessage(err.code));
    }
  };

  // ============================================
  // メール/パスワードで新規登録
  // ============================================
  const handleSignUp = async () => {
    setError('');
    try {
      // createUserWithEmailAndPassword: 新しいアカウントを作成し、
      // そのままログイン状態にもなる。
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(toJapaneseMessage(err.code));
    }
  };

  // ============================================
  // Googleアカウントでログイン
  // ============================================
  const handleGoogleSignIn = async () => {
    setError('');
    try {
      // GoogleAuthProvider: 「Googleでログインする」という認証方法を表す。
      // signInWithPopup: ポップアップウィンドウでGoogleのログイン画面を開き、
      // ユーザーがアカウントを選択すると、そのままFirebaseのログイン状態になる。
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      // ユーザーが自分でポップアップを閉じた場合はエラー表示しない
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(toJapaneseMessage(err.code));
      }
    }
  };

  // ============================================
  // ログアウト
  // ============================================
  const handleSignOut = async () => {
    // signOut: ログイン状態を解除する。これもonAuthStateChangedを発火させ、
    // userがnullに戻る。
    await signOut(auth);
  };

  if (loading) {
    return (
      <main className="mx-auto min-h-screen max-w-md border-x px-4 py-10">
        <p className="text-sm text-muted-foreground">読み込み中...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-md border-x px-4 py-10">
      <Link
        href="/learn"
        className="text-sm font-bold text-primary underline underline-offset-4"
      >
        ← /learn/ に戻る
      </Link>
      <h1 className="mt-4 text-2xl font-bold">Firebase Authenticationの基本</h1>
      <p className="mt-2 text-muted-foreground">
        Zustandやサーバー側のセッションCookieを使わず、
        <code className="rounded bg-muted px-1 py-0.5">useState</code>
        だけでメール/パスワード認証とGoogleログインを行うシンプルな例です。
      </p>

      {user ? (
        // ---- ログイン中の表示 ----
        <div className="mt-6 space-y-3 rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">ログイン中</p>
          <p className="break-words font-medium">
            {user.displayName || '（表示名なし）'}
          </p>
          <p className="break-words text-sm text-muted-foreground">
            {user.email}
          </p>
          <p className="break-words text-xs text-muted-foreground">
            uid: {user.uid}
          </p>
          <Button variant="destructive" onClick={handleSignOut}>
            サインアウト
          </Button>
        </div>
      ) : (
        // ---- 未ログイン時の表示 ----
        <div className="mt-6 space-y-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignIn}
          >
            Googleでログイン
          </Button>

          <form onSubmit={handleSignIn} className="space-y-2">
            <Input
              type="email"
              placeholder="メールアドレス"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="パスワード（6文字以上）"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                ログイン
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handleSignUp}
              >
                新規登録
              </Button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
