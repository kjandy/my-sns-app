'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { div, p } from 'motion/react-client';
import { MapPin } from 'lucide-react';
import { MOCK_USERS, useMockAuthStore } from '@/stores/mockAuthStore';
import { dummyPosts } from '@/lib/learn/dummyData';
import { PostRow } from './PostRow';
import { useRouter } from 'next/navigation';

const getInitials = (name) => (name ? name.charAt(0).toUpperCase() : '?');

export const ProfileClient = ({ uid }) => {
  const [users, setUsers] = useState(MOCK_USERS);
  const [posts, setPosts] = useState(dummyPosts);
  const profileUser = users.find((u) => u.uid === uid);
  const userPosts = posts.filter((p) => p.userId === uid);
  const { user } = useMockAuthStore();
  const router = useRouter();
  return (
    <main className="mx-auto min-h-screen max-w-4xl border-x">
      <div className="border-b p-4">
        <Link
          href="/"
          className="text-sm text-primary underline underline-offset-4"
        >
          ← タイムラインに戻る
        </Link>
      </div>
      <div className="border-b pb-4" id="profile-contens">
        <div
          className="h-32 bg-muted bg-cover bg-center md:h-56"
          style={
            profileUser.bannerURL
              ? { backgroundImage: `url(${profileUser.bannerURL})` }
              : undefined
          }
        />
        <div className="px-4 md:px-8">
          <div className="flex items-end justify-between gap-3">
            <Avatar className="-mt-10 size-20 border-4 border-background bg-background md:-mt-16 md:size-32">
              {profileUser.photoURL ? (
                <AvatarImage
                  src={profileUser.photoURL}
                  alt={profileUser.displayName}
                />
              ) : null}
              <AvatarFallback className="bg-primary text-2xl font-bold text-primary-foreground md:text-4xl">
                {getInitials(profileUser.displayName)}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="mt-3 min-w-0">
            <h2 className="truncate text-xl font-bold md:text-3xl">
              {profileUser.displayName}
            </h2>
            <p className="truncate text-sm text-muted-foreground">
              {profileUser.email}
            </p>
          </div>
          {profileUser.bio && (
            <p className="mt-3 whitespace-pre-wrap text-[15px]">
              {profileUser.bio}
            </p>
          )}
          {profileUser.location && (
            <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="size-4" />
              {profileUser.location}
            </div>
          )}
          <div className="mt-3 flex gap-4 text-sm">
            <span>
              <strong className="text-foreground">128</strong>{' '}
              <span className="text-muted-foreground">フォロー中</span>
            </span>
            <span>
              <strong className="text-foreground">46</strong>{' '}
              <span className="text-muted-foreground">フォロワー</span>
            </span>
          </div>
        </div>
      </div>
      {/* profile-contensここまで */}
      <div className="mx-auto max-w-2xl" id="user-timeline">
        {userPosts.length === 0 ? (
          <div>まだ投稿がありません</div>
        ) : (
          userPosts.map((post) => (
            <PostRow
              key={post.id}
              post={post}
              currentUserId={user.uid}
              onClick={() => router.push(`/post/${post.id}`)}
            />
          ))
        )}
      </div>
    </main>
  );
};
