'use client';

import React, { ReactNode, useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from './sidebar';
import TopNav from './top-nav';
import Toast from './toast';
import { useUI, useAuth } from '@/lib/context';

// Pages that don't need auth or sidebar
const PUBLIC_ROUTES = ['/login', '/onboarding/setup', '/onboarding/user', '/onboarding/welcome', '/invitations/accept'];

interface RootLayoutClientProps {
  children: ReactNode;
}

export default function RootLayoutClient({ children }: RootLayoutClientProps) {
  const { toasts, addToast }          = useUI();
  const { user, isLoading }           = useAuth();
  const pathname                      = usePathname();
  const router                        = useRouter();

  // Sidebar state persisted to localStorage
  const [sidebarOpen, setSidebarOpen] = useState(true);
  useEffect(() => {
    const val = localStorage.getItem('sidebar_open');
    if (val !== null) setSidebarOpen(val === 'true');
  }, []);
  useEffect(() => {
    localStorage.setItem('sidebar_open', String(sidebarOpen));
  }, [sidebarOpen]);

  const isPublicRoute = pathname === '/' || PUBLIC_ROUTES.some((r) => pathname.startsWith(r));

  // Show "session expired" toast when apiFetch fires auth:unauthorized
  useEffect(() => {
    const handleSessionExpired = () => {
      addToast({ type: 'error', message: 'Session expired. Please log in again.' });
    };
    window.addEventListener('auth:show-session-expired', handleSessionExpired);
    return () => window.removeEventListener('auth:show-session-expired', handleSessionExpired);
  }, [addToast]);

  useEffect(() => {
    if (isLoading) return;

    // Not logged in → go to login (unless already on a public route)
    if (!user && !isPublicRoute) {
      router.replace('/login');
      return;
    }

    // Logged in routing logic
    if (user) {
      const orgSetupComplete = user.organization?.setupComplete ?? false;
      const userOnboardingComplete = user.onboardingComplete ?? false;

      // Owner without org setup → go to org setup wizard
      if (user.isOwner && !orgSetupComplete && pathname !== '/onboarding/setup') {
        router.replace('/onboarding/setup');
        return;
      }

      // Invited user without onboarding complete → go to user onboarding
      if (!user.isOwner && !userOnboardingComplete && pathname !== '/onboarding/user') {
        router.replace('/onboarding/user');
        return;
      }

      // Owner with org setup complete → redirect away from org setup page
      if (user.isOwner && orgSetupComplete && pathname === '/onboarding/setup') {
        router.replace('/onboarding/welcome');
        return;
      }

      // Owner with org setup complete → redirect away from welcome (if they manually navigate back)
      // — allow /onboarding/welcome for owners only; non-owners shouldn't be here
      if (!user.isOwner && pathname === '/onboarding/welcome') {
        router.replace('/dashboard');
        return;
      }

      // User with onboarding complete → redirect away from user onboarding page
      if (userOnboardingComplete && pathname === '/onboarding/user') {
        router.replace('/dashboard');
        return;
      }

      // All authenticated users with complete setup → redirect away from landing / login
      if ((user.isOwner ? orgSetupComplete : userOnboardingComplete) && (pathname === '/' || pathname === '/login')) {
        router.replace('/dashboard');
        return;
      }
    }
  }, [user, isLoading, pathname, isPublicRoute, router]);

  // Full-screen spinner while auth loads
  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // Public routes — no sidebar
  if (isPublicRoute || !user) {
    return (
      <div className="min-h-screen bg-background">
        <main>{children}</main>
        <div className="fixed bottom-4 right-4 z-[9999] space-y-2 max-w-md">
          {toasts.map((t) => <Toast key={t.id} toast={t} />)}
        </div>
      </div>
    );
  }

  // Authenticated app shell
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNav onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>

      <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-md">
        {toasts.map((t) => <Toast key={t.id} toast={t} />)}
      </div>
    </div>
  );
}
