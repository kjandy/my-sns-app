// ============================================
// 2. Firebase Admin設定 (lib/firebase-admin.js)
// このファイルは、Firebase Admin SDKを初期化し、
// サーバー側での認証とFirestoreデータベース操作を可能にします。
// ログインしたユーザーが本当に正規ユーザーかをサーバーで検証します。
// ============================================
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore'; // ← サーバー側Firestore

// Firebase Admin SDKの初期化
function initializeFirebaseAdmin() {
  //  すでに初期化されている場合は再利用
  if (getApps().length > 0) {
    // Firebase Admin SDK はシングルトンとして動作するため
    // 複数回初期化しないようにする
    return { auth: getAuth(), db: getFirestore() };
  }

  const privateKey = process.env.FIREBASE_PRIVATE_KEY; // 環境変数から秘密鍵を取得
  if (!privateKey) throw new Error('FIREBASE_PRIVATE_KEY is not set'); //  秘密鍵がない場合はエラー

  let formattedKey = privateKey; //  改行コードを正しく処理
  //  環境変数の値が引用符で囲まれている場合、それを削除
  if (formattedKey.startsWith('"') && formattedKey.endsWith('"')) {
    formattedKey = formattedKey.slice(1, -1); // 両端の引用符を削除
  }
  formattedKey = formattedKey.replace(/\\n/g, '\n'); //  エスケープされた改行を実際の改行に変換

  // Firebase Admin SDK を初期化
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: formattedKey,
    }), // cert() で認証情報を設定
  });

  return { auth: getAuth(), db: getFirestore() }; // Firestore インスタンスも取得
}

const admin = initializeFirebaseAdmin();
//  Firebase Admin SDK の認証とデータベースインスタンスをエクスポート
export const adminAuth = admin.auth;
export const adminDb = admin.db;
