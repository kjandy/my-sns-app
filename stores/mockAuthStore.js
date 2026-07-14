/**
 *
 *
 * ダミーのユーザーデータ
 *
 */

import { create } from 'zustand';

export const MOCK_USERS = [
  {
    uid: 'u1',
    displayName: '田中 花子',
    email: 'hanako@example.com',
    photoURL: '',
  },
  {
    uid: 'u2',
    displayName: '山田 太郎',
    email: 'taro@example.com',
    photoURL: '',
  },
  {
    uid: 'u3',
    displayName: '佐藤 次郎',
    email: 'jiro@example.com',
    photoURL: '',
  },
];

export const useMockAuthStore = create((set) => ({
  user: MOCK_USERS[0], //最初は田中花子としてログインしている扱いにする
  switchUser: (uid) => {
    const nextUser = MOCK_USERS.find((u) => u.uid === uid);
    if (nextUser) set({ user: nextUser });
  },
}));
