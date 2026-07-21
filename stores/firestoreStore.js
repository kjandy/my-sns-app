/**
 *
 *
 * Zustand Store (stores/firestoreStore.js)
 *
 */

import { create } from 'zustand';

const useFirestoreStore = create((set, get) => ({
  // ==============================
  // 投稿を追加
  // ==============================
  addPost: async () => {},
}));

export default useFirestoreStore;
