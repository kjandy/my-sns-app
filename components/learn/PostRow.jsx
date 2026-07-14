import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

const getInitials = (name) => (name ? name.charAt(0).toUpperCase() : '?');

export const PostRow = ({ post }) => {
  return (
    <article className="flex gap-3 border-b p-4 transition-colors hover:bg-muted/40 md:p-8 cursor-pointer">
      <Avatar className="size-10 shrink-0">
        {post.userPhotoURL ? (
          <AvatarImage src={post.userPhotoURL} alt={post.userName} />
        ) : null}
        <AvatarFallback className="bg-primary text-sm font-bold text-primary-foreground">
          {getInitials(post.userName)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-sm">
          <span className="truncate font-bold">{post.userName}</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">2時間前</span>
        </div>
        <p className="mt-0.5 whitespace-pre-wrap wrap-break-word text-[15px]">
          {post.content}
        </p>
        <div className="mt-2 -ml-1.5 flex items-center gap-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-full px-1.5 py-1 text-sm transition-colors hover:bg-destructive/10 hover:text-destructive text-muted-foreground"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                className="lucide lucide-heart size-4"
                aria-hidden="true"
              >
                <path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"></path>
              </svg>
              <span>2</span>
            </button>
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-full px-1.5 py-1 text-sm transition-colors hover:bg-muted hover:text-foreground text-muted-foreground"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                className="lucide lucide-thumbs-down size-4"
                aria-hidden="true"
              >
                <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z"></path>
                <path d="M17 14V2"></path>
              </svg>
            </button>
          </div>
          <div className="flex items-center gap-1.5 rounded-full px-1.5 py-1 text-sm text-muted-foreground">
            <span>5 コメント</span>
          </div>
        </div>
      </div>
    </article>
  );
};
