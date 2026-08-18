/**
 *
 * セッションCookieの発行 / 削除（lib/auth-actions.js）
 *
 * "use server" を付けたファイルの関数は「Server Action」と呼ばれ、
 * クライアント側から普通の関数のように呼び出せるが、
 * 実際の処理はサーバー上でだけ実行される。
 * → Admin SDKの秘密鍵がブラウザに渡ることは無い。
 *
 * ★なぜセッションCookieが必要なのか
 *   Firebaseのログイン状態は、そのままではブラウザの中だけの情報。
 *   Server Component（app/page.js など）は「今アクセスしてきたのは誰か」を
 *   知る手段が無い。
 *   そこで、ログイン直後にブラウザが持っている idToken をサーバーへ送り、
 *   Admin SDKで検証したうえで httpOnly Cookie に変換して保存する。
 *   これで、以降のリクエストではCookieが自動送信され、
 *   サーバー側だけでログイン判定ができるようになる。
 *
 */

'use server';

import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebase-admin';

export async function createSessionAction(idToken) {
  try {
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5日間（ミリ秒）

    // まず「本物のidTokenか」をAdmin SDKで検証する。
    // ここを飛ばすと、誰かが適当な文字列を送ってきてもCookieを発行してしまう。
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    // 検証を通ったidTokenだけをセッションCookieに変換する
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn,
    });

    const cookieStore = await cookies();
    cookieStore.set('session', sessionCookie, {
      maxAge: expiresIn / 1000, // maxAgeは「秒」単位なので1000で割る
      // httpOnly: JavaScriptから document.cookie で読めなくなる。
      //   XSS（悪意あるスクリプトの混入）でセッションを盗まれるのを防ぐ、
      //   このアプリで最も重要なセキュリティ設定。
      httpOnly: true,
      // secure: HTTPS接続のときだけCookieを送る。
      //   ローカル開発は http なので、開発時はfalseにしないと保存されない。
      secure: process.env.NODE_ENV === 'production',
      // sameSite: 'lax' … 別サイトからのPOST等ではCookieを送らない（CSRF対策）
      sameSite: 'lax',
      path: '/',
    });

    return { success: true, uid: decodedToken.uid };
  } catch (error) {
    // 呼び出し元でエラー内容を判別できるよう、throwではなく戻り値で返す
    console.error('Session creation error:', error.message);
    return { success: false, error: error.message };
  }
}

export async function signOutAction() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('session');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
