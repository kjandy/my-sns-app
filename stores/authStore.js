/**
 *
 * 認証状態の Zustand Store（stores/authStore.js）
 *
 * ★この章でやることは、突き詰めると次の2つだけ
 *   1. useMockAuthStore とまったく同じ形（user）の状態を返す、本物のストアを作る
 *   2. Firestoreルールを request.auth ベースのものに差し替える（Console側の作業）
 *
 *
 *   `import { useMockAuthStore } from '@/stores/mockAuthStore'` を
 *   `import useAuthStore from '@/stores/authStore'` に書き換えるだけで動く。
 *   「ログインユーザーの取得元」だけを差し替えられるようにしてきた成果。
 *
 * ★モックとの違いが1つだけある: loading
 *   モックは最初から user が入っていたが、本物の認証では
 *   「まだ判定中（loading: true）」という状態が存在する。
 *   これを無視すると、ログイン済みでも一瞬「未ログイン」の画面が見えてしまう。
 *
 */

import { create } from 'zustand';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { createSessionAction, signOutAction } from '@/lib/auth-actions';
import useFirestoreStore from '@/stores/firestoreStore';

const useAuthStore = create((set) => ({
  // --- State ---
  user: null, // 未ログイン、または判定前は null
  loading: true, // onAuthStateChangedが1回でも呼ばれるまでは true
  error: null,

  // --- Actions ---
  setUser: (user) => set({ user, loading: false }),
  setError: (error) => set({ error }),

  // --- 認証メソッド ---
  signIn: async (email, password) => {
    try {
      set({ error: null });
      await signInWithEmailAndPassword(auth, email, password);
      // ここでuserをsetしないのは、onAuthStateChanged が
      // 自動的に発火して setUser を呼んでくれるため（状態の管理場所を1つに保つ）
    } catch (error) {
      const msg = getAuthErrorMessage(error.code);
      set({ error: msg });
      throw new Error(msg);
    }
  },

  signUp: async (email, password, displayName) => {
    try {
      set({ error: null });
      if (password.length < 6) {
        throw new Error('パスワードは6文字以上である必要があります');
      }
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      // メール/パスワード登録では表示名が空になるので、ここで設定する。
      // trim()して、空白だけの名前が登録されるのを防ぐ。
      if (displayName?.trim()) {
        await updateProfile(cred.user, { displayName: displayName.trim() });
      }
    } catch (error) {
      const msg = error.message || getAuthErrorMessage(error.code);
      set({ error: msg });
      throw new Error(msg);
    }
  },

  signInWithGoogle: async () => {
    try {
      set({ error: null });
      const provider = new GoogleAuthProvider();
      // 毎回アカウント選択画面を出す。
      // これが無いと、複数アカウントを持つ人が別アカウントでログインできない
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
    } catch (error) {
      // ポップアップを自分で閉じただけならエラー扱いしない（よくある操作なので）
      if (error.code !== 'auth/popup-closed-by-user') {
        const msg = getAuthErrorMessage(error.code);
        set({ error: msg });
        throw new Error(msg);
      }
    }
  },

  signOut: async () => {
    try {
      // ★順番が重要：先にサーバー側のCookieを消す。
      //   もし firebaseSignOut() を先に呼ぶと、
      //   クライアントは即座に未ログインになる一方、
      //   signOutAction() が失敗するとサーバー側のCookieだけが残る。
      //   すると「画面上は未ログインなのに、/login へ行くとサーバーが
      //   ログイン済みと判断して / へ戻され、ログイン画面に二度と
      //   たどり着けない」という詰み状態になる。
      const result = await signOutAction();
      if (!result.success) {
        throw new Error(result.error || 'セッションの削除に失敗しました');
      }
      await firebaseSignOut(auth);
      set({ user: null, error: null });
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      // Cookie削除に失敗したときは user を null にしない
      // （サーバーとクライアントの状態が食い違うのを避ける）
      const message = 'ログアウトに失敗しました。もう一度お試しください。';
      set({ error: message });
      return { success: false, error: message };
    }
  },

  // --- セッション ---
  // ブラウザが持っているidTokenをServer Actionへ渡し、
  // サーバー側でhttpOnly Cookieに変換してもらう（lib/auth-actions.js参照）
  createSession: async (user) => {
    try {
      const idToken = await user.getIdToken();
      const result = await createSessionAction(idToken);
      if (!result.success) {
        console.error('Session creation failed:', result.error);
      }
    } catch (error) {
      console.error('Error creating session:', error);
    }
  },
}));

// --- Firebaseのエラーコードを日本語メッセージに変換する ---
// error.code はそのまま出しても利用者には意味が分からないため、
// 画面に出す文言へ翻訳している。
function getAuthErrorMessage(code) {
  const messages = {
    'auth/invalid-email': 'メールアドレスの形式が正しくありません',
    'auth/user-not-found': 'このメールアドレスは登録されていません',
    'auth/wrong-password': 'パスワードが間違っています',
    'auth/invalid-credential': 'メールアドレスまたはパスワードが間違っています',
    'auth/email-already-in-use': 'このメールアドレスは既に使用されています',
    'auth/weak-password': 'パスワードが弱すぎます。6文字以上にしてください',
    'auth/popup-blocked': 'ポップアップがブロックされました',
    'auth/operation-not-allowed': '認証が有効になっていません',
    'auth/too-many-requests': 'しばらく待ってから再度お試しください',
  };
  return messages[code] || `認証エラー: ${code}`;
}

/**
 * 認証状態の監視を開始する。
 *
 * onAuthStateChanged は、ログイン・ログアウト・トークンの自動更新など、
 * Firebase側で認証状態が変わるたびに呼ばれる。
 * ページを再読み込みした直後にも1回呼ばれるので、
 * 「ログイン済みかどうか」の初期判定もこれで行える。
 *
 * 戻り値は購読解除の関数。ClientLayout の useEffect のクリーンアップで呼ぶ。
 *
 * 14章では「モックユーザーを切り替えるたびに upsertProfile」していたが、
 * ここで本来の「ログインするたびに upsertProfile」の形に戻る。
 */
export function initAuth() {
  return onAuthStateChanged(auth, async (user) => {
    // getState(): ストアの外側から現在の状態・アクションを取り出す関数。
    // Reactコンポーネントの外なのでフックの形（useAuthStore()）では呼べない。
    const store = useAuthStore.getState();
    store.setUser(user);

    if (user) {
      // 1. idTokenをサーバーへ送り、httpOnlyのセッションCookieを発行してもらう
      await store.createSession(user);
      // 2. users/{uid} を最新のプロフィール情報で更新する（14章の処理）
      await useFirestoreStore.getState().upsertProfile(user);
    }
  });
}

export default useAuthStore;
