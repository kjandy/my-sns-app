'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { db } from '@/lib/firebase';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { div } from 'motion/react-client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function LearnFirestorePage() {
  //一覧表示用の状態。Firestoreから取得した内容をそのまま入れる
  const [memos, setMemos] = useState([]);
  //新規フォームの入力中テキスト
  const [newText, setNewText] = useState('');
  //初回の取得が終わるまでの読み込み中フラグ
  const [loading, setLoading] = useState(true);
  // 「今どのメモを編集中か」を1つだけ覚えておく。
  // nullなら何も編集していない状態。
  const [editingId, setEditindId] = useState(null);
  // 編集中のメモの入力中テキスト（保存時の一時的な値）
  const [editingText, setEditingText] = useState('');

  // ====================================
  // Read：リアルタイム購読
  // ====================================
  useEffect(() => {
    const q = query(
      collection(db, 'learnMemos'),
      orderBy('createdAt', 'desc') // 新しく追加したメモが先頭に来るようにする(降順、昇順)
    );
    // onSnapshot：一度取得して終わりではなく、Firestore上のデータが変化する度
    // 自動でコールバックを呼び直してくれる「リアルタイム購読」。
    const unsubscribe = onSnapshot(q, (snapshot) => {
      // snapshot.docsは該当する全ドキュメントの配列
      const items = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setMemos(items);
      setLoading(false);
    });
    return () => unsubscribe();
    // const timeId = setInterval(() => {
    //  console.log('1秒ごとに！');
    // }, 1000)
    // クリーンアップ関数：コンポーネントが消える時にタイマーを止める
    // return () => clearInterval(timeId);
    //
  }, []);
  // ====================================
  // Create：新規追加
  // ====================================
  const handleAdd = async (e) => {
    e.preventDefault(); //フォーム送信によるページの再読み込みを防ぐ
    const trimed = newText.trim();
    if (!trimed) return; //空文字だけの送信は無視する
    // addDoc：コレクションに新しいドキュメントを1件追加する
    // ドキュメントIDはFirestoreが自動で発行する。
    await addDoc(collection(db, 'learnMemos'), {
      text: trimed,
      // serverTimestamp():自分の端末の時計ではなく、Firestoreサーバー側で
      // 記録された時刻を使う。並び順(orderBy)がズレないようにするため。
      createdAt: serverTimestamp(),
    });
    setNewText(''); // 送信後は入力欄を空に戻す
  };
  // ====================================
  // Delete：削除(Firestoreのデータを削除)
  // ====================================
  const handleDelete = async (id) => {
    // deleteDoc：指定したドキュメントを1件削除する。
    // doc(db, 'learnMemos', id)で「learnMemosコレクションの、id番目のドキュメント」を指す
    await deleteDoc(doc(db, 'learnMemos', id));
  };
  // ====================================
  // Update：編集モードの開始・保存・キャンセル
  // ====================================
  const startEdit = (memo) => {
    setEditindId(memo.id);
    setEditingText(memo.text);
  };
  const cancelEdit = () => {
    setEditindId(null);
    setEditingText('');
  };
  const handleUpdate = async (id) => {
    const trimed = editingText.trim();
    if (!trimed) return; //空文字だけの送信は無視する
    // updateDoc：ドキュメントの一部フィールドだけを更新する。
    // ここではtextだけを渡しているので、createdAtなど他のフィールドは
    // そのまま残る（addDocと違い、ドキュメント全体を上書きするわけではない）
    await updateDoc(doc(db, 'learnMemos', id), { text: trimed });
    //Firestoreのデータをupdateできたら、編集モードを終了する
    cancelEdit();
  };
  return (
    <main className="mx-auto min-h-screen max-w-2xl border-x px-4 py-10">
      <Link
        href="/learn/"
        className="text-sm font-bold text-primary underline underline-offset-4"
      >
        ← /learn/に戻る
      </Link>
      <h1 className="mt-4 text-2xl font-bold">Firestoreの基本（CRUD処理）</h1>
      <p className="mt-2 text-muted-foreground">
        Zustandなどの状態管理ライブラリを使わず、useStateだけでFirestoreの作成・読み取り・更新・削除を行うシンプルなサンプルです。
      </p>
      {/* Create：新規追加フォーム */}
      <form onSubmit={handleAdd} className="mt-6 flex gap-2">
        <Input
          onChange={(e) => setNewText(e.target.value)}
          value={newText}
          placeholder="メモを入力してEnter"
        />
        <Button type="submit">追加</Button>
      </form>
      {/* Read：一覧表示 */}
      <div className="mt-6 space-y-2">
        {loading && (
          <p className="text-sm text-muted-foreground">読み込み中...</p>
        )}
        {!loading && memos.length === 0 && (
          <p className="text-sm text-muted-foreground">
            まだメモがありません。上のフォームから追加してください。
          </p>
        )}
        {memos.map((memo) => (
          <div
            key={memo.id}
            className="flex items-center gap-2 rounded-lg border p-3"
          >
            {editingId === memo.id ? (
              // ---- 編集モード中の表示（Update） -----
              <>
                <Input
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleUpdate(memo.id)}
                >
                  保存
                </Button>
                <Button size="sm" variant="destructive" onClick={cancelEdit}>
                  キャンセル
                </Button>
              </>
            ) : (
              // ---- 通常表示 ------
              <>
                <p className="flex-1 break-words">{memo.text}</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => startEdit(memo)}
                >
                  編集
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(memo.id)}
                >
                  削除
                </Button>
              </>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
