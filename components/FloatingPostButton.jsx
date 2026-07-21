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

export const FloatingPostButton = () => {
  return (
    <Dialog>
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
        <form className="space-y-4 mt-4">
          <div className="space-y-2" id="form-input">
            <Label>内容</Label>
          </div>
          <div className="flex justify-end gap-2" id="form-btn"></div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
