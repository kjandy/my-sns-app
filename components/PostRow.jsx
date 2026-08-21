import { useMockAuthStore } from "@/stores/mockAuthStore";
import { ReactionButtons } from "./ReactionButtons";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import useFirestoreStore from "@/stores/firestoreStore";
import { cn, formatRelativeTime } from "@/lib/utils";
import useAuthStore from "@/stores/authStore";
import { useRouter } from "next/navigation";

const getInitials = (name) => (name ? name.charAt(0).toUpperCase() : "?");

export const PostRow = ({ post, currentUserId, onClick }) => {
  // const { user } = useMockAuthStore();
  const { user } = useAuthStore();
  const router = useRouter();
  const { toggleLike, toggleBad } = useFirestoreStore();
  const isOwnPost = post.userId === currentUserId;
  const handleGoToProfile = (e) => {
    e.stopPropagation();
    router.push(`/profile/${post.userId}`);
    // console.log(post.userId);
  };
  // ReactionButtonsから「押す前の状態(isLiked)」が渡ってくるので
  // それをそのままFirestore側のトグル処理へ受け渡す
  const handleToggleLike = async (isLiked) => {
    if (!user) return;
    try {
      await toggleLike(post.id, user.uid, isLiked);
    } catch (error) {
      console.error("Like error", error);
    }
  };
  const handleToggleBad = async (isBad) => {
    if (!user) return;
    try {
      await toggleBad(post.id, user.uid, isBad);
    } catch (error) {
      console.error("Bad error", error);
    }
  };
  return (
    <article
      onClick={onClick}
      className={`flex gap-3 border-b p-4 transition-colors hover:bg-muted/40 md:p-8 cursor-pointer ${isOwnPost ? "bg-primary/5" : ""}`}
    >
      <button type="button" onClick={handleGoToProfile}>
        <Avatar className="size-10 shrink-0">
          {post.userPhotoURL ? (
            <AvatarImage src={post.userPhotoURL} alt={post.userName} />
          ) : null}
          <AvatarFallback className="bg-primary text-sm font-bold text-primary-foreground">
            {getInitials(post.userName)}
          </AvatarFallback>
        </Avatar>
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-sm">
          <span className="truncate font-bold">{post.userName}</span>
          {/* createdAt は serverTimestamp() で書き込んだ直後の一瞬だけ
              まだnullのことがある（サーバー側で時刻が確定する前）。
              そのため「値があるときだけ」表示する。 */}
          {post.createdAt && (
            <>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground">
                {formatRelativeTime(post.createdAt)}
              </span>
            </>
          )}
          {isOwnPost && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
              あなたの投稿
            </span>
          )}
        </div>
        <p className="mt-0.5 whitespace-pre-wrap wrap-break-word text-[15px]">
          {post.content}
        </p>
        <div className="mt-2 -ml-1.5 flex items-center gap-4">
          <ReactionButtons
            likedBy={post.likedBy || []}
            badBy={post.badBy || []}
            currentUserId={user?.uid}
            onToggleLike={handleToggleLike}
            onToggleBad={handleToggleBad}
          />
          <div className="flex items-center gap-1.5 rounded-full px-1.5 py-1 text-sm text-muted-foreground">
            <span>5 コメント</span>
          </div>
        </div>
      </div>
    </article>
  );
};
