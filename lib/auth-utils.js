/**
 *
 * サーバー側でログインユーザーを判定するユーティリティ（lib/auth-utils.js）
 *
 * Server Component（app/page.js など）から呼び出して、
 * 「今アクセスしてきたのは誰か」をサーバー側だけで判定する。
 * 未ログイン、またはCookieが無効・期限切れなら null を返す。
 *
 * ★"use server" は付けない
 *   このファイルはServer Action（クライアントから呼ばれる関数）ではなく、
 *   Server Componentの中から直接呼ばれるただの関数のため。
 *
 */

import { cookies } from 'next/headers';
import { adminAuth } from './firebase-admin';

export async function getCurrentUser() {
  // cookies(): Next.jsが用意している、リクエストのCookieを読む関数
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;

  // そもそもCookieが無い＝一度もログインしていない
  if (!session) return null;

  try {
    // verifySessionCookie の第2引数 true は
    // 「revoked（無効化済み）かどうかもチェックする」という指定。
    // 少し厳しめ（Firebaseへの問い合わせが発生する）だが、
    // ログアウト済みのCookieを使い回されるのを防げる。
    const decodedClaims = await adminAuth.verifySessionCookie(session, true);
    return decodedClaims; // uid や email を含むオブジェクト
  } catch (error) {
    // 期限切れ・改ざん・無効化済みなど。いずれも「未ログイン扱い」でよい
    console.error('Session verification error:', error);
    return null;
  }
}
