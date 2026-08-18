'use client';
import React, { useEffect } from 'react';
// import { DevUserSwitcher } from './DevUserSwitcher';
import { FloatingPostButton } from './FloatingPostButton';
import { MobileNav } from './MobileNav';
import Header from './Header';
import { initAuth } from '@/stores/authStore';

export const ClientLayout = ({ children }) => {
  // Firebaseの認証状態監視を開始
  // initMockAuth()を呼び出していたが、firabse authenticationに置き換えて
  // initAuth()を使う。役割はまったく同じ（今ログインしているのは誰か）を確定させ
  // users/{uid}を最新化する。
  // initeAuth()は購読解除の関数を返すので、クリーンアップで必ず呼ぶ。
  // onSnapshotと同じ「購読したら必ず解除する」の原則
  useEffect(() => {
    const unsubscribe = initAuth();
    return () => unsubscribe();
  }, []);
  return (
    <>
      <Header />
      {children}
      <FloatingPostButton />
      {/* <DevUserSwitcher /> */}
      <MobileNav />
    </>
  );
};
