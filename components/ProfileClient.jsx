/**
 *
 * プロフィールページのクライアント部分(components/ProfileClient.jsx)
 *
 * 4つのデータを同時にリアルタイム購読
 * 1. users/{uid}  --- プロフィール情報（自己紹介、出身地など）
 * 2. posts(where userId == uid) ---- このユーザーの投稿一覧
 * 3. フォロワー数　---- following配列にこのuidを含むusersの件数
 * 4. 自分のfollowing配列　---- フォローボタンの表示切り替えに使用
 *
 */

"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { div, p } from "motion/react-client";
import { ArrowLeft, MapPin } from "lucide-react";
// import { MOCK_USERS, useMockAuthStore } from '@/stores/mockAuthStore';
// import { dummyPosts } from '@/lib/learn/dummyData';
import { PostRow } from "./PostRow";
import { useRouter } from "next/navigation";
import useAuthStore from "@/stores/authStore";
import useFirestoreStore from "@/stores/firestoreStore";
import { Button } from "@/components/ui/button";
import { EditProfileDialog } from "@/components/EditProfileDialog";
import useSocialStore from "@/stores/socialStore";

const getInitials = (name) => (name ? name.charAt(0).toUpperCase() : "?");

export const ProfileClient = ({ uid }) => {
  // const [users, setUsers] = useState(MOCK_USERS);
  // const [posts, setPosts] = useState(dummyPosts);
  // const profileUser = users.find((u) => u.uid === uid);
  // const userPosts = posts.filter((p) => p.userId === uid);
  // const { user } = useMockAuthStore();
  const { user } = useAuthStore();
  const {
    profileUser,
    profileUserLoading,
    subscribeToProfileUser,
    unsubscribeFromProfileUser,
    posts,
    loading: postsLoading,
    // loading: timelineLoading,
    subscribeToUserPosts,
    unsubscribeFromPosts,
  } = useFirestoreStore();
  const {
    following,
    followerCount,
    subscribeMyFollowing,
    unsubscribeMyFollowing,
    subscribeFollowerCount,
    unsubscribeFollowerCount,
    follow,
    unfollow,
  } = useSocialStore();
  // 連打で何度もFirestoreへ書込まないよう、処理中はボタンを無効化する
  const [followActionLoading, setFollowActionLoading] = useState(false);
  const router = useRouter();
  // URLのuid、または自分のuidが変わるたびに購読をやり直す
  // クリーンアップ関数で必ず両方unsubscribeするのを忘れないこと
  // (別のプロフィールへ移動したときに前のユーザーの購読が残ってしまうから)
  useEffect(() => {
    subscribeToProfileUser(uid);
    subscribeToUserPosts(uid);
    subscribeFollowerCount(uid);
    if (user?.uid) {
      subscribeMyFollowing(user.uid);
    }
    return () => {
      unsubscribeFromProfileUser();
      unsubscribeFromPosts();
      unsubscribeFollowerCount();
      unsubscribeMyFollowing();
    };
  }, [uid, user?.uid]);
  const [editOpen, setEditOpen] = useState(false);
  // 自分自身のプロフィールを見ているかどうか。
  // 「編集」ボタンを出すかどうかの判定に使う。
  const isSelf = user?.uid === uid;

  // 自分のfollowing配列に、今見ているプロフィールのuidがはいっているか
  const isFollowing = following.includes(uid);

  // フォロー中の人数はusers/{uid}.following配列の長さ
  // フォロー機能を作るまでこのフィールドは存在しないので0になる
  const followingCount = profileUser?.following?.length || 0;
  const handleToggleFollow = async () => {
    if (!user) return;
    setFollowActionLoading(true);
    try {
      // 書込み後はsubscribeMyFollowingの購読が自動で反応し
      // ボタンの表示も勝手に切り替わる（手動でsetStateする必要がない）
      if (isFollowing) {
        await unfollow(user.uid, uid);
      } else {
        await follow(user.uid, uid);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setFollowActionLoading(false);
    }
  };

  // 「投稿はあるが users/{uid}が無い」ユーザーへの対応（フォールバック）
  // users/{uid}は「ログイン（=ユーザー切り替え）したとき」にしか作られない。
  // プロフィール機能を導入する前から投稿していて、まだ一度も切り替えていないユーザーは
  // ドキュメントを持っていない。
  // その場合は、投稿側にコピーされている投稿者情報を代わりに使う。
  // 「後から追加した機能が、既存データと矛盾なく動くようにする」考慮は
  // 実務でも頻繁に必要になるパターンです。
  const fallbackPost = posts[0];
  const displayName =
    profileUser?.displayName || fallbackPost?.userName || "ユーザー";
  const email = profileUser?.email || fallbackPost?.userEmail || "";
  const photoURL = profileUser?.photoURL || fallbackPost?.userPhotoURL || "";
  const isLoading = profileUserLoading || postsLoading;
  // プロフィールも投稿も両方ない = そのuidのユーザーは存在しない。
  const notFound = !isLoading && profileUser === null && posts.length === 0;
  return (
    <main className="mx-auto min-h-screen max-w-4xl border-x">
      <div className="sticky top-14 z-40 flex items-center gap-4 border-b bg-background/80 px-4 py-3 backdrop-blur-md md:px-8">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => router.push("/")}
          aria-label="TOPページに戻る"
        >
          <ArrowLeft className="size-5" />
        </Button>
        <h1 className="text-xl font-bold">プロフィール</h1>
      </div>

      {isLoading ? (
        <div className="px-4 py-16 text-center text-muted-foreground md:px-8">
          読み込み中...
        </div>
      ) : notFound ? (
        <div className="px-4 py-16 text-center text-muted-foreground md:px-8">
          ユーザーが見つかりませんでした
        </div>
      ) : (
        <>
          <div className="border-b pb-4">
            {/* ヘッダー画像（バナー）。
                未設定のときは style を渡さず、bg-muted のグレーだけを見せる */}
            <div
              className="h-32 bg-muted bg-cover bg-center md:h-56"
              style={
                profileUser?.bannerURL
                  ? { backgroundImage: `url(${profileUser.bannerURL})` }
                  : undefined
              }
            />

            <div className="px-4 md:px-8">
              <div className="flex items-end justify-between gap-3">
                {/* -mt-10 でバナー画像に半分重ねる。border-4 で切り抜き風の縁取り */}
                <Avatar className="-mt-10 size-20 border-4 border-background bg-background md:-mt-16 md:size-32">
                  {photoURL ? (
                    <AvatarImage src={photoURL} alt={displayName} />
                  ) : null}
                  <AvatarFallback className="bg-primary text-2xl font-bold text-primary-foreground md:text-4xl">
                    {getInitials(displayName || email)}
                  </AvatarFallback>
                </Avatar>

                {/* 自分のプロフィール → 「編集」
                    他人のプロフィール → 「フォロー / フォロー中」
                    自分を自分でフォローできてしまうと followerCount が
                    おかしくなるため、ボタンごと出し分けている */}
                {isSelf ? (
                  <Button
                    variant="outline"
                    className="mt-2"
                    onClick={() => setEditOpen(true)}
                  >
                    編集
                  </Button>
                ) : (
                  user && (
                    <Button
                      // フォロー中は「押したら解除される」ことが伝わるよう
                      // 塗りつぶしではなく枠線だけの見た目にする
                      variant={isFollowing ? "outline" : "default"}
                      className="mt-2"
                      onClick={handleToggleFollow}
                      disabled={followActionLoading}
                    >
                      {isFollowing ? "フォロー中" : "フォロー"}
                    </Button>
                  )
                )}
              </div>

              <div className="mt-3 min-w-0">
                <h2 className="truncate text-xl font-bold md:text-3xl">
                  {displayName}
                  {isSelf && (
                    <span className="ml-2 text-sm font-normal text-muted-foreground md:text-base">
                      (自分)
                    </span>
                  )}
                </h2>
              </div>

              {/* 自己紹介・出身地は未設定なら要素ごと出さない */}
              {profileUser?.bio && (
                <p className="mt-3 whitespace-pre-wrap text-[15px]">
                  {profileUser.bio}
                </p>
              )}

              {profileUser?.location && (
                <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="size-4" />
                  {profileUser.location}
                </div>
              )}

              <div className="mt-3 flex gap-4 text-sm">
                <span>
                  <strong className="text-foreground">{followingCount}</strong>{" "}
                  <span className="text-muted-foreground">フォロー中</span>
                </span>
                <span>
                  <strong className="text-foreground">{followerCount}</strong>{" "}
                  <span className="text-muted-foreground">フォロワー</span>
                </span>
              </div>
            </div>
          </div>

          {/* 投稿一覧。TOPページ・投稿詳細と同じ PostRow を再利用している。
              幅もタイムラインと揃えるため max-w-2xl でくくる */}
          <div className="mx-auto max-w-2xl">
            {posts.length === 0 ? (
              <div className="px-4 py-16 text-center text-muted-foreground md:px-8">
                まだ投稿がありません
              </div>
            ) : (
              posts.map((post) => (
                <PostRow
                  key={post.id}
                  post={post}
                  onClick={() => router.push(`/post/${post.id}`)}
                />
              ))
            )}
          </div>
        </>
      )}

      {/* ダイアログ本体は自分のプロフィールのときだけマウントする */}
      {isSelf && (
        <EditProfileDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          uid={uid}
          profileUser={profileUser}
        />
      )}
    </main>
  );
};
