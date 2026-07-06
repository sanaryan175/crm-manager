'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, Bell, HelpCircle, LogOut, Settings2, ChevronDown, User, Target, Calendar } from 'lucide-react';
import { useAuth, useUI, useRegion } from '@/lib/context';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '@/lib/api';
import FaqModal from './faq-modal';

interface TopNavProps {
  onMenuClick: () => void;
}

export default function TopNav({ onMenuClick }: TopNavProps) {
  const { user, logout } = useAuth();
  const { addToast }     = useUI();
  const { formatDateTime } = useRegion();
  const router           = useRouter();
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unread, setUnread] = useState(0);
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());
  const notifRef = useRef<HTMLDivElement>(null);

  const storageKey = user ? `seen_notifications_${user.id}` : null;

  // Load seen IDs from localStorage on mount
  useEffect(() => {
    if (storageKey) {
      try {
        const raw = localStorage.getItem(storageKey);
        if (raw) setSeenIds(new Set(JSON.parse(raw)));
      } catch { /* ignore */ }
    }
  }, [storageKey]);

  const persistSeen = (ids: Set<string>) => {
    if (storageKey) localStorage.setItem(storageKey, JSON.stringify([...ids]));
  };

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await apiFetch('/notifications');
      setNotifications(res.notifications ?? []);
      setUnread(res.unread ?? 0);
    } catch {
      // notifications are non-critical
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const displayUnread = notifications.filter((n) => !seenIds.has(n.id)).length;

  const markSeen = (id: string) => {
    setSeenIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      persistSeen(next);
      return next;
    });
  };

  const markAllSeen = () => {
    setSeenIds((prev) => {
      const all = new Set(prev);
      notifications.forEach((n) => all.add(n.id));
      persistSeen(all);
      return all;
    });
  };

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    if (notifOpen) document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [notifOpen]);
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
    <>
      <FaqModal isOpen={faqOpen} onClose={() => setFaqOpen(false)} />
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
        <div className="relative" ref={notifRef}>
          <button onClick={() => { setNotifOpen((o) => !o); if (!notifOpen) fetchNotifications(); }} className="p-2 hover:bg-accent/10 rounded-lg transition-colors relative">
            <Bell className="w-5 h-5" />
            {displayUnread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground px-1 leading-none">
                {displayUnread > 9 ? '9+' : displayUnread}
              </span>
            )}
          </button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.12 }}
                className="absolute top-full right-0 mt-2 w-80 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-border bg-muted/20">
                  <p className="text-sm font-semibold text-foreground">Notifications</p>
                  <p className="text-xs text-muted-foreground">{displayUnread > 0 ? `${displayUnread} unread` : 'All caught up'}</p>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                      <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((n: any) => (
                      <button
                        key={n.id}
                        onClick={() => { markSeen(n.id); setNotifOpen(false); router.push(n.type === 'deal' ? '/deals' : '/activities'); }}
                        className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-accent/10 transition-colors border-b border-border/50 last:border-0"
                      >
                        <div className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${n.type === 'deal' ? 'bg-primary/10 text-primary' : 'bg-amber-500/10 text-amber-500'}`}>
                          {n.type === 'deal' ? <Target className="w-3.5 h-3.5" /> : <Calendar className="w-3.5 h-3.5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground truncate">{n.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {n.type === 'deal' ? 'Deal' : 'Activity'}
                            {n.contactName ? ` · ${n.contactName}` : ''}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
                {displayUnread > 0 && (
                  <div className="border-t border-border px-4 py-2.5 bg-muted/10">
                    <button onClick={markAllSeen} className="w-full text-xs text-center text-primary hover:underline font-medium">
                      Mark all as read
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <button onClick={() => setFaqOpen(true)} className="p-2 hover:bg-accent/10 rounded-lg transition-colors">
          <HelpCircle className="w-5 h-5" />
        </button>

        {/* Live Clock */}
        {user && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/30 border border-border/40 text-xs font-medium text-muted-foreground tabular-nums">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            {formatDateTime(now)}
          </div>
        )}

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
    </>
  );
}
