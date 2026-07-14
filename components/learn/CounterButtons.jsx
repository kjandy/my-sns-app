'use client';

import useCounterStore from '@/stores/counterStore';
import { Button } from '@/components/ui/button';

export const CounterButtons = () => {
  const { increment, decrement, reset } = useCounterStore();
  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-sm text-muted-foreground">
        操作ボタン（CounterButtons.jsx）
      </p>
      <div className="flex gap-2">
        <Button variant="outline" onClick={decrement}>
          -1
        </Button>
        <Button variant="outline" onClick={reset}>
          リセット
        </Button>
        <Button onClick={increment}>+1</Button>
      </div>
    </div>
  );
};
