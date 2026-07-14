'use client';
import { MOCK_USERS, useMockAuthStore } from '@/stores/mockAuthStore';

export const DevUserSwitcher = () => {
  const { user, switchUser } = useMockAuthStore();
  return (
    <div className="fixed bottom-4 right-4 z-50 rounded-lg border bg-background p-2 text-xs shadow-lg">
      <p className="mb-1 text-muted-foreground">今ログイン中（開発用）:</p>
      <div className="flex gap-1">
        {MOCK_USERS.map((u) => (
          <button
            key={u.uid}
            type="button"
            onClick={() => switchUser(u.uid)}
            className={`rounded px-2 py-1 ${u.uid === user.uid ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
          >
            {u.displayName}
          </button>
        ))}
      </div>
    </div>
  );
};
