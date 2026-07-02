'use client';

import React, { ReactNode } from 'react';
import { AuthProvider, UIProvider, FilterProvider, RegionProvider } from '@/lib/context';
import RootLayoutClient from './root-layout';

interface RootLayoutServerProps {
  children: ReactNode;
}

export default function RootLayoutServer({ children }: RootLayoutServerProps) {
  return (
    <AuthProvider>
      <UIProvider>
        <FilterProvider>
          <RegionProvider>
            <RootLayoutClient>
              {children}
            </RootLayoutClient>
          </RegionProvider>
        </FilterProvider>
      </UIProvider>
    </AuthProvider>
  );
}
