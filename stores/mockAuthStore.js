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
    bio: '毎日散歩するのが好きです。',
    location: '東京都',
    bannerURL:
      'https://plus.unsplash.com/premium_photo-1784206736948-1ace6a2bb9b3?q=80&w=2064&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    following: ['u2'],
  },
  {
    uid: 'u2',
    displayName: '山田 太郎',
    email: 'taro@example.com',
    photoURL: '',
    bio: 'エンジニアです。新しい技術を追いかけるのが好き。',
    location: '大阪府',
    bannerURL: '',
    following: [],
  },
  {
    uid: 'u3',
    displayName: '佐藤 次郎',
    email: 'jiro@example.com',
    photoURL: '',
    bio: '',
    location: '',
    bannerURL: '',
    following: ['u1', 'u2'],
  },
];

export const useMockAuthStore = create((set) => ({
  user: MOCK_USERS[0], //最初は田中花子としてログインしている扱いにする
  switchUser: (uid) => {
    const nextUser = MOCK_USERS.find((u) => u.uid === uid);
    if (nextUser) set({ user: nextUser });
  },
}));
