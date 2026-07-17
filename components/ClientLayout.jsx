import React from 'react';
import { DevUserSwitcher } from './DevUserSwitcher';

export const ClientLayout = ({ children }) => {
  return (
    <>
      {children}
      <DevUserSwitcher />
    </>
  );
};
