'use client';

import useCounterStore from '@/stores/counterStore';

export const CounterDisplay = () => {
  const count = useCounterStore((state) => state.count);
  return (
    <div className="rounded-xl border bg-card p-8 text-center">
      <p className="text-sm text-muted-foreground">
        現在のカウント（CounterDisplay.jsx）
      </p>
      <p className="text-6xl font-bold tabular-nums text-primary">{count}</p>
    </div>
  );
};
