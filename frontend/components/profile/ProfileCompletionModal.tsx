'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Briefcase, Image, CheckCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '@/lib/context';
import { useUI } from '@/lib/context';
import { apiFetch } from '@/lib/api';

/**
 * ProfileCompletionModal
 *
 * Non-blocking overlay shown to invited users once (per user, persisted in DB).
 *
 * - Reads user from useAuth — takes no required props.
 * - Shows itself when user.profileCompleted is false.
 * - Collects: display name (pre-filled), job title, avatar URL.
 * - On submit: PATCH /auth/me with { name, jobTitle, avatar?, profileCompleted: true }.
 * - On skip:   PATCH /auth/me with { profileCompleted: true } — never shows again.
 * - Does NOT block dashboard access under any circumstance.
 */
export default function ProfileCompletionModal() {
  const { user, refreshUser } = useAuth();
  const { addToast }    = useUI();

  const [isVisible,    setIsVisible]    = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form fields
  const [displayName, setDisplayName] = useState('');
  const [jobTitle,    setJobTitle]    = useState('');
  const [avatarUrl,   setAvatarUrl]   = useState('');

  // Determine whether to show the modal
  useEffect(() => {
    if (!user) return;

    // Owners go through the Setup Wizard instead — don't show this modal
    if (user.isOwner) return;

    // Show only once — profileCompleted is persisted in the database
    if (!user.profileCompleted) {
      setDisplayName(user.name ?? '');
      setJobTitle(user.jobTitle ?? '');
      setIsVisible(true);
    }
  }, [user]);

  const markCompleted = async (payload: Record<string, unknown>) => {
    setIsSubmitting(true);
    try {
      await apiFetch('/auth/me', {
        method: 'PATCH',
        body: JSON.stringify({ ...payload, profileCompleted: true }),
      });
      setIsVisible(false);
      await refreshUser();
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'Something went wrong.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    markCompleted({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = displayName.trim();
    if (!trimmedName) {
      addToast({ type: 'error', message: 'Display name cannot be empty.' });
      return;
    }

    const payload: Record<string, unknown> = {
      name: trimmedName,
      jobTitle: jobTitle.trim() || undefined,
    };
    if (avatarUrl.trim()) {
      payload.avatar = avatarUrl.trim();
    }

    await markCompleted(payload);
    addToast({ type: 'success', message: 'Profile updated successfully!' });
  };

  // Derive the avatar preview character(s) to show in the avatar circle
  const avatarPreview = avatarUrl.trim()
    ? null  // will render <img> instead
    : (displayName.trim()
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join('') || '?');

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Semi-transparent backdrop — pointer-events:none so dashboard is still clickable */}
          <motion.div
            key="profile-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 z-40 pointer-events-none"
            aria-hidden="true"
          />

          {/* Modal panel */}
          <motion.div
            key="profile-modal-panel"
            initial={{ opacity: 0, scale: 0.95, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 24 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-completion-title"
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md mx-4"
          >
            <div className="bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-start justify-between p-6 border-b border-border bg-gradient-to-r from-primary/5 to-accent/5">
                <div>
                  <h2
                    id="profile-completion-title"
                    className="text-lg font-semibold text-foreground"
                  >
                    Complete your profile
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Help your teammates identify you — takes less than a minute.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSkip}
                  aria-label="Skip profile completion"
                  className="text-muted-foreground hover:text-foreground transition-colors ml-4 mt-0.5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Avatar preview */}
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-lg flex-shrink-0 overflow-hidden shadow-md shadow-primary/20">
                    {avatarUrl.trim() ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatarUrl.trim()}
                        alt="Avatar preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fall back to initials if the URL is broken
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <span>{avatarPreview}</span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{displayName || 'Your Name'}</p>
                    <p className="text-xs text-muted-foreground">{jobTitle || 'Your role'}</p>
                  </div>
                </div>

                {/* Display Name */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="profile-display-name"
                    className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                  >
                    Display Name <span className="text-primary">*</span>
                  </label>
                  <div className="flex items-center gap-2 bg-muted/40 border border-border/60 rounded-lg px-3 py-2.5 focus-within:border-primary/60 transition-colors">
                    <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <input
                      id="profile-display-name"
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Sarah Chen"
                      autoComplete="name"
                      required
                      className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground/50"
                    />
                    {displayName.trim().length > 0 && (
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    )}
                  </div>
                </div>

                {/* Job Title */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="profile-job-title"
                    className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                  >
                    Job Title
                    <span className="ml-1.5 text-muted-foreground/60 font-normal normal-case tracking-normal">
                      (optional)
                    </span>
                  </label>
                  <div className="flex items-center gap-2 bg-muted/40 border border-border/60 rounded-lg px-3 py-2.5 focus-within:border-primary/60 transition-colors">
                    <Briefcase className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <input
                      id="profile-job-title"
                      type="text"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="Sales Representative"
                      autoComplete="organization-title"
                      className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground/50"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground/70">
                    Shown to teammates.
                  </p>
                </div>

                {/* Avatar URL */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="profile-avatar-url"
                    className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                  >
                    Profile Picture URL
                    <span className="ml-1.5 text-muted-foreground/60 font-normal normal-case tracking-normal">
                      (optional)
                    </span>
                  </label>
                  <div className="flex items-center gap-2 bg-muted/40 border border-border/60 rounded-lg px-3 py-2.5 focus-within:border-primary/60 transition-colors">
                    <Image className="w-4 h-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                    <input
                      id="profile-avatar-url"
                      type="url"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder="https://example.com/photo.jpg"
                      autoComplete="photo"
                      className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground/50"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={isSubmitting || !displayName.trim()}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    ) : (
                      <>
                        Save profile
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleSkip}
                    disabled={isSubmitting}
                    className="px-4 py-2.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                  >
                    Skip for now
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
