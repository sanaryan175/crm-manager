'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, Bell, HelpCircle, LogOut, Settings2, ChevronDown, User } from 'lucide-react';
import { useAuth, useUI } from '@/lib/context';
import { motion } from 'framer-motion';

interface TopNavProps {
  onMenuClick: () => void;
}

export default function TopNav({ onMenuClick }: TopNavProps) {
  const { user, logout } = useAuth();
  const { addToast }     = useUI();
  const router           = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [dropdownOpen]);

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    addToast({ type: 'info', message: 'You have been logged out.' });
  };

  const initials = user
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '';

  return (
    <motion.header
      initial={{ y: -64 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
      className="h-16 bg-card border-b border-border px-6 flex items-center justify-between"
    >
      {/* Left */}
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="lg:hidden p-2 hover:bg-accent/10 rounded-lg transition-colors">
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        <button className="p-2 hover:bg-accent/10 rounded-lg transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
        </button>
        <button className="p-2 hover:bg-accent/10 rounded-lg transition-colors">
          <HelpCircle className="w-5 h-5" />
        </button>

        {/* User dropdown */}
        {user && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((o) => !o)}
              className="flex items-center gap-2 pl-3 border-l border-border hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center text-xs font-bold text-white">
                {initials}
              </div>
              <div className="hidden sm:block text-xs text-left">
                <p className="font-medium text-foreground leading-none">{user.name}</p>
                <p className="text-muted-foreground capitalize mt-0.5">{user.role.displayName}</p>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.12 }}
                className="absolute top-full right-0 mt-2 w-56 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden"
              >
                {/* Info header */}
                <div className="px-4 py-3 border-b border-border bg-muted/20">
                  <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium capitalize">
                    {user.role.displayName}
                  </span>
                </div>

                {/* Menu items */}
                <div className="py-1">
                  <button
                    onClick={() => { setDropdownOpen(false); router.push('/settings?tab=profile'); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-accent/10 transition-colors"
                  >
                    <User className="w-4 h-4 text-muted-foreground" />
                    My Profile
                  </button>
                  <button
                    onClick={() => { setDropdownOpen(false); router.push('/settings?tab=preferences'); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-accent/10 transition-colors"
                  >
                    <Settings2 className="w-4 h-4 text-muted-foreground" />
                    Preferences
                  </button>
                  <div className="border-t border-border/50 my-1" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </motion.header>
  );
}
