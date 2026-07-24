import React from 'react';
import { DevUserSwitcher } from './DevUserSwitcher';
import { FloatingPostButton } from './FloatingPostButton';

export const ClientLayout = ({ children }) => {
  return (
    <>
      {children}
      <FloatingPostButton />
      <DevUserSwitcher />
    </>
  );
};
