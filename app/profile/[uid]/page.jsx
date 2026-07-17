import { ProfileClient } from '@/components/ProfileClient';

/**
 *
 *
 * プロフィールページ
 *
 */
export default async function ProfilePage({ params }) {
  const { uid } = await params;
  return <ProfileClient uid={uid} />;
}
