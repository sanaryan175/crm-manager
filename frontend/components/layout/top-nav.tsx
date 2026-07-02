'use client';

import React from 'react';
import { Menu, Search, Bell, HelpCircle } from 'lucide-react';
import { useAuth } from '@/lib/context';
import { motion } from 'framer-motion';

interface TopNavProps {
  onMenuClick: () => void;
}

export default function TopNav({ onMenuClick }: TopNavProps) {
  const { user } = useAuth();

  return (
    <motion.header
      initial={{ y: -64 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
      className="h-16 bg-card border-b border-border px-6 flex items-center justify-between"
    >
      {/* Left side */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-accent/10 rounded-lg transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search bar */}
        <div className="hidden md:flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2 flex-1 max-w-sm">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search..."
            className="flex-1 bg-transparent outline-none text-sm"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        <button className="p-2 hover:bg-accent/10 rounded-lg transition-colors relative">
          <Bell className="w-5 h-5" />
          <div className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
        </button>

        <button className="p-2 hover:bg-accent/10 rounded-lg transition-colors">
          <HelpCircle className="w-5 h-5" />
        </button>

        {/* User avatar */}
        {user && (
          <div className="flex items-center gap-3 pl-4 border-l border-border">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center text-xs font-bold text-white">
              {user.name
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </div>
            <div className="hidden sm:block text-xs">
              <p className="font-medium text-foreground">{user.name}</p>
              <p className="text-muted-foreground capitalize">{user.role.displayName}</p>
            </div>
          </div>
        )}
      </div>
    </motion.header>
  );
}
