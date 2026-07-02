'use client';

import React, { ReactNode, useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from './sidebar';
import TopNav from './top-nav';
import Toast from './toast';
import { useUI, useAuth } from '@/lib/context';

interface RootLayoutClientProps {
  children: ReactNode;
}

export default function RootLayoutClient({ children }: RootLayoutClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { toasts } = useUI();
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Redirect to login if user is unauthenticated
  useEffect(() => {
    if (!isLoading && !user && pathname !== '/login') {
      router.replace('/login');
    }
  }, [user, isLoading, pathname, router]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // If on login route or unauthenticated (redirecting), render children directly without sidebars
  if (pathname === '/login' || (!user && pathname !== '/login')) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-between">
        <main className="flex-1">
          {children}
        </main>
        
        {/* Toast notifications */}
        <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-md">
          {toasts.map((toast) => (
            <Toast key={toast.id} toast={toast} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation */}
        <TopNav onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>

      {/* Toast notifications */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-md">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} />
        ))}
      </div>
    </div>
  );
}

