'use client';

import React from 'react';
import { initializeFirebase } from '.';
import { FirebaseProvider } from './provider';

const firebaseInstance = initializeFirebase();

export const FirebaseClientProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <FirebaseProvider value={firebaseInstance}>{children}</FirebaseProvider>
  );
};
