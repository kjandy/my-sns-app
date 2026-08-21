/**
 *
 * プロフィール編集ダイアログ（components/EditProfileDialog.jsx）
 *
 * 編集できるのは「Authに紐づかない項目」だけ：
 *   - bannerURL … プロフィール上部のヘッダー画像
 *   - bio       … 自己紹介（キャッチコピー）
 *   - location  … 出身地
 *
 * displayName / email / photoURL を編集対象にしていないのは、
 * それらが upsertProfile（＝ログインのたびの上書き）で管理されているから。
 * ここで編集しても次のログインで元に戻ってしまうため、あえて外している。
 *
 */

"use client";

import { useEffect, useState } from "react";
import useFirestoreStore from "@/stores/firestoreStore";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

export const EditProfileDialog = ({
  open,
  onOpenChange,
  uid,
  profileUser, // Firestoreから購読中の users/{uid} の中身
}) => {
  const { updateProfileDetails } = useFirestoreStore();

  const [bannerURL, setBannerURL] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ダイアログを「開いたとき」に、今保存されている値をフォームへ流し込む。
  //
  // なぜ useState の初期値で済ませないのか：
  //   useStateの初期値は最初の1回しか使われない。
  //   一方 profileUser はFirestoreの購読結果なので、
  //   コンポーネントの初回描画時にはまだ null のことがある。
  //   また、一度閉じてから開き直したときに「編集途中で捨てた値」ではなく
  //   「保存済みの値」から始めたい。そのため open をきっかけに毎回リセットする。
  useEffect(() => {
    if (open) {
      setBannerURL(profileUser?.bannerURL || "");
      setBio(profileUser?.bio || "");
      setLocation(profileUser?.location || "");
    }
  }, [open, profileUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await updateProfileDetails(uid, { bannerURL, bio, location });
      // 保存に成功したときだけ閉じる。
      // 失敗時は開いたままにして、入力内容が消えないようにする。
      onOpenChange(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>プロフィールを編集</DialogTitle>
          <DialogDescription className="sr-only">
            ヘッダー画像・自己紹介・出身地を編集します
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-2 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="banner-url">ヘッダー画像URL</Label>
            {/* 画像アップロード（Firebase Storage）は扱う内容が増えるため、
                このハンズオンでは「画像のURLを直接入力する」方式にしている */}
            <Input
              id="banner-url"
              placeholder="https://example.com/banner.jpg"
              value={bannerURL}
              onChange={(e) => setBannerURL(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">自己紹介（キャッチコピー）</Label>
            <textarea
              id="bio"
              className="min-h-[90px] w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="自己紹介を書いてください"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">出身地</Label>
            <Input
              id="location"
              placeholder="例：東京"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "保存中..." : "保存"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
