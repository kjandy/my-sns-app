import { ReactionButtons } from './ReactionButtons';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

const getInitials = (name) => (name ? name.charAt(0).toUpperCase() : '?');

export const PostRow = ({ post, currentUserId, onClick, onAvatarClick }) => {
  const isOwnPost = post.userId === currentUserId;
  const handleAvatarClick = (e) => {
    if (!onAvatarClick) return;
    e.stopPropagation();
    onAvatarClick(post.userId);
    // console.log(post.userId);
  };
  return (
    <article
      onClick={onClick}
      className={`flex gap-3 border-b p-4 transition-colors hover:bg-muted/40 md:p-8 cursor-pointer ${isOwnPost ? 'bg-primary/5' : ''}`}
    >
      <button type="button" onClick={handleAvatarClick}>
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
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">2時間前</span>
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
          <ReactionButtons />
          <div className="flex items-center gap-1.5 rounded-full px-1.5 py-1 text-sm text-muted-foreground">
            <span>5 コメント</span>
          </div>
        </div>
      </div>
    </article>
  );
};
