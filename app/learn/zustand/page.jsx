import { CounterButtons } from '@/components/learn/CounterButtons';
import { CounterDisplay } from '@/components/learn/CounterDisplay';
import Link from 'next/link';
import React from 'react';

export default function ZustandPage() {
  return (
    <main className="mx-auto min-h-screen max-w-2xl border-x px-4 py-10">
      <p>
        <Link href="/">TOPへ</Link>
      </p>
      <h1 className="text-2xl font-bold">Zustand 学習ページ</h1>
      <p className="mt-2 text-muted-foreground">
        このページは、Zustandの一番シンプルな使い方を確認するための練習用ページです。
      </p>

      <div className="mt-8 grid gap-4">
        <CounterDisplay />
        <CounterButtons />
      </div>

      <div className="mt-8 rounded-lg border bg-muted/40 p-4 text-sm leading-relaxed">
        <p className="font-bold">ここで確認してほしいポイント</p>
        <p className="mt-1 text-muted-foreground">
          上の数字（<code>CounterDisplay.jsx</code>）とボタン（
          <code>CounterButtons.jsx</code>）は、まったく別々のコンポーネントで、
          お互いにpropsを渡し合ってもいません。それでもボタンを押すと数字がすぐに変わります。これは両方が同じ
          <code>stores/counterStore.js</code>
          を見ているためです。もし<code>useState</code>
          だけでこれをやろうとすると、
          共通の親コンポーネントで状態を持って、props経由で子に渡す必要があります。Zustandを使うと、その受け渡しが不要になります。
        </p>
      </div>
    </main>
  );
}
