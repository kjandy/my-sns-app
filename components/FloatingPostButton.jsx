/**
 *
 * 投稿ボタンコンポーネント + 投稿フォーム
 *
 */

'use client';
import { PenSquare } from 'lucide-react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Label } from './ui/label';
import { useState } from 'react';
import { useMockAuthStore } from '@/stores/mockAuthStore';
import useFirestoreStore from '@/stores/firestoreStore';

export const FloatingPostButton = () => {
  const { user } = useMockAuthStore();
  const { addPost } = useFirestoreStore();
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user) return null;
  //formの送信メソッド
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content) return;
    setIsSubmitting(true);
    try {
      await addPost(
        user.uid,
        user.email,
        user.displayName,
        user.photoURL,
        content
      );
    } catch (err) {
    } finally {
    }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          className="fixed bottom-20 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all z-40 md:bottom-6"
        >
          <PenSquare className="h-6 w-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>新規投稿</DialogTitle>
          <DialogDescription className="sr-only">
            内容を入力して新しい投稿を作成します
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2" id="form-input">
            <Label>内容</Label>
            <textarea
              id="post-content"
              className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="何を考えていますか？"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="flex justify-end gap-2" id="form-btn">
            <Button
              onClick={() => setOpen(false)}
              type="button"
              variant="outline"
              disabled={isSubmitting}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? '投稿中...' : '投稿'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
