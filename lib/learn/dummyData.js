/**
 *
 *
 * Postsのダミーデータ
 *
 *
 */

export const dummyPosts = [
  {
    id: '1',
    userId: 'u1',
    userName: '田中 花子',
    userEmail: 'hanako@example.com',
    userPhotoURL: '',
    content: '今日は天気が良くて気持ちいいですね。散歩に出かけました。',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2時間前
    likedBy: ['u2', 'u3'],
    badBy: [],
    commentCount: 5,
  },
  {
    id: '2',
    userId: 'u2',
    userName: '山田 太郎',
    userEmail: 'taro@example.com',
    userPhotoURL: '',
    content:
      '新しいプロジェクトを始めました。progressをここでシェアしていきます！',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4),
    likedBy: ['u1'],
    badBy: ['u3'],
    commentCount: 2,
  },
  {
    id: '3',
    userId: 'u3',
    userName: '佐藤 次郎',
    userEmail: 'jiro@example.com',
    userPhotoURL: '',
    content: '週末は久しぶりにキャンプに行ってきました。リフレッシュできました。',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6時間前
    likedBy: ['u1'],
    badBy: [],
    commentCount: 1,
  },
];
