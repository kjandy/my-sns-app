'use client';
import { MOCK_USERS } from '@/stores/mockAuthStore';
import { useState } from 'react';

export const ProfileClient = ({ uid }) => {
  const [users, setUsers] = useState(MOCK_USERS);
  const profileUser = users.find((u) => u.uid === uid);
  return (
    <>
      <h1>{profileUser.displayName}</h1>
    </>
  );
};
