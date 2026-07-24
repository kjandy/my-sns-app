/**
 *
 *
 * Zustand Store (stores/firestoreStore.js)
 *
 */

import { db } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { create } from 'zustand';

const useFirestoreStore = create((set, get) => ({
  // ==============================
  // 投稿を追加
  // ==============================
  addPost: async (userId, userEmail, userName, userPhotoURL, content) => {
    // console.log(userId, userEmail, userName, userPhotoURL, content);
    try {
      await addDoc(collection(db, 'posts'), {
        userId,
        userEmail: userEmail ?? '',
        userName: userName ?? '',
        userPhotoURL: userPhotoURL ?? '',
        content,
        createdAt: serverTimestamp(), //firestoreへの書込み日時
      });
    } catch (error) {
      console.error('Add Post Error', error);
      set({ error: error.message });
      throw error;
    }
  },
}));

export default useFirestoreStore;
