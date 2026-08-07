import React from 'react';
import { DevUserSwitcher } from './DevUserSwitcher';
import { FloatingPostButton } from './FloatingPostButton';
import { MobileNav } from './MobileNav';

export const ClientLayout = ({ children }) => {
  return (
    <>
      {children}
      <FloatingPostButton />
      <DevUserSwitcher />
      <MobileNav />
    </>
  );
};
