'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle, Circle, ArrowRight, UserPlus, Users,
  Briefcase, Activity, Sparkles, ChevronRight, ExternalLink, AlertCircle,
} from 'lucide-react';
import { useAuth, useUI } from '@/lib/context';
import { apiFetch } from '@/lib/api';

// ─── Checklist Item ────────────────────────────────────────────────────────────

interface CheckItem {
  id:       string;
  label:    string;
  sublabel: string;
  done:     boolean;
  href?:    string;
  action?:  string;
}

function ChecklistCard({
  item, index, onAction,
}: { item: CheckItem; index: number; onAction: (id: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.07 }}
      className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 ${
        item.done
          ? 'bg-emerald-500/5 border-emerald-500/20'
          : 'bg-card/60 border-border/40 hover:border-primary/30'
      }`}
    >
      <div className="flex-shrink-0">
        {item.done ? (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: index * 0.07 + 0.1 }}>
            <CheckCircle className="w-6 h-6 text-emerald-500" />
          </motion.div>
        ) : (
          <Circle className="w-6 h-6 text-muted-foreground/40" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${item.done ? 'text-emerald-400 line-through decoration-emerald-500/50' : 'text-foreground'}`}>
          {item.label}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{item.sublabel}</p>
      </div>

      {!item.done && (
        <button
          onClick={() => onAction(item.id)}
          className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold transition-colors"
        >
          {item.action || 'Start'} <ChevronRight className="w-3.5 h-3.5" />
        </button>
      )}
    </motion.div>
  );
}

// ─── Progress Ring ─────────────────────────────────────────────────────────────

function ProgressRing({ pct }: { pct: number }) {
  const r   = 36;
  const circ = 2 * Math.PI * r;
  const dash = circ - (pct / 100) * circ;

  return (
    <svg width="96" height="96" className="-rotate-90">
      <circle cx="48" cy="48" r={r} fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/30" />
      <motion.circle
        cx="48" cy="48" r={r} fill="none"
        stroke="url(#progressGrad)" strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: dash }}
        transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
      />
      <defs>
        <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="hsl(var(--primary))" />
          <stop offset="100%" stopColor="hsl(var(--accent))" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WelcomePage() {
  const router       = useRouter();
  const { user, isLoading } = useAuth();
  const { addToast }        = useUI();

  const [counts, setCounts] = useState({
    invitations: -1,  // -1 = loading
    contacts:    -1,
    deals:       -1,
    activities:  -1,
  });
  const [dismissed, setDismissed] = useState(false);

  // Guard: only owner with complete setup
  useEffect(() => {
    if (isLoading) return;
    if (!user) { router.replace('/login'); return; }
    if (!user.isOwner) { router.replace('/dashboard'); return; }
    if (!user.organization?.setupComplete) { router.replace('/onboarding/setup'); return; }
  }, [user, isLoading, router]);

  // Fetch counts for checklist
  const loadCounts = useCallback(async () => {
    try {
      const [invRes, conRes, dealRes, actRes] = await Promise.allSettled([
        apiFetch('/invitations'),
        apiFetch('/contacts'),
        apiFetch('/deals'),
        apiFetch('/activities'),
      ]);
      setCounts({
        invitations: invRes.status  === 'fulfilled' ? (invRes.value?.length  ?? 0) : 0,
        contacts:    conRes.status  === 'fulfilled' ? (conRes.value?.length  ?? 0) : 0,
        deals:       dealRes.status === 'fulfilled' ? (dealRes.value?.length ?? 0) : 0,
        activities:  actRes.status  === 'fulfilled' ? (actRes.value?.length  ?? 0) : 0,
      });
    } catch {
      setCounts({ invitations: 0, contacts: 0, deals: 0, activities: 0 });
    }
  }, []);

  useEffect(() => {
    if (user?.isOwner && user.organization?.setupComplete) {
      loadCounts();
    }
  }, [user, loadCounts]);

  const loading = counts.invitations === -1;

  const checklist: CheckItem[] = [
    {
      id:       'org',
      label:    'Organization Created',
      sublabel: user?.organization?.name ? `"${user.organization.name}" is ready` : 'Your workspace is live',
      done:     true,
    },
    {
      id:       'profile',
      label:    'Profile Complete',
      sublabel: `Logged in as ${user?.name ?? ''}`,
      done:     true,
    },
    {
      id:       'invite',
      label:    'Invite Your First Team Member',
      sublabel: counts.invitations > 0 ? `${counts.invitations} invitation${counts.invitations > 1 ? 's' : ''} sent` : 'Grow your team — admins, managers, reps',
      done:     counts.invitations > 0,
      action:   'Invite',
    },
    {
      id:       'contact',
      label:    'Create Your First Contact',
      sublabel: counts.contacts > 0 ? `${counts.contacts} contact${counts.contacts > 1 ? 's' : ''} added` : 'Add a lead or customer to get started',
      done:     counts.contacts > 0,
      action:   'Add Contact',
    },
    {
      id:       'deal',
      label:    'Create Your First Deal',
      sublabel: counts.deals > 0 ? `${counts.deals} deal${counts.deals > 1 ? 's' : ''} in pipeline` : 'Start tracking revenue opportunities',
      done:     counts.deals > 0,
      action:   'Add Deal',
    },
    {
      id:       'activity',
      label:    'Schedule Your First Activity',
      sublabel: counts.activities > 0 ? `${counts.activities} activit${counts.activities > 1 ? 'ies' : 'y'} logged` : 'Log a call, meeting, or task',
      done:     counts.activities > 0,
      action:   'Schedule',
    },
  ];

  const doneCount = checklist.filter((c) => c.done).length;
  const pct       = Math.round((doneCount / checklist.length) * 100);

  const [inviteOpen, setInviteOpen] = useState(false);

  const handleAction = (id: string) => {
    if (id === 'invite')   { setInviteOpen(true); return; }
    if (id === 'contact')  { router.push('/contacts'); return; }
    if (id === 'deal')     { router.push('/deals'); return; }
    if (id === 'activity') { router.push('/activities'); return; }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary via-accent to-primary opacity-80" />
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-2xl relative z-10">
        {/* Hero greeting */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight mb-2">
            Welcome, {user?.name?.split(' ')[0]}!
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            <span className="font-semibold text-foreground">{user?.organization?.name}</span> is ready.
            Let's set up your workspace so your team can start closing deals.
          </p>
        </motion.div>

        {/* Progress card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="bg-card/80 backdrop-blur-sm border border-border/40 rounded-2xl p-6 mb-6 shadow-2xl"
        >
          <div className="flex items-center gap-6 mb-6">
            <div className="relative">
              <ProgressRing pct={pct} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-black text-foreground">{pct}%</span>
                <span className="text-[10px] text-muted-foreground">done</span>
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-foreground mb-1">Workspace Setup</h2>
              <p className="text-sm text-muted-foreground">
                {doneCount} of {checklist.length} tasks complete
              </p>
              {/* Progress bar */}
              <div className="mt-3 h-2 bg-muted/40 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 1.2, ease: 'easeOut', delay: 0.4 }}
                />
              </div>
              {pct === 100 && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
                  className="text-xs text-emerald-400 font-semibold mt-2 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> All set! Your CRM is fully configured.
                </motion.p>
              )}
            </div>
          </div>

          {/* Checklist */}
          <div className="space-y-3">
            {loading ? (
              [...Array(6)].map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-muted/20 animate-pulse" />
              ))
            ) : (
              checklist.map((item, i) => (
                <ChecklistCard key={item.id} item={item} index={i} onAction={handleAction} />
              ))
            )}
          </div>
        </motion.div>

        {/* Quick-action row */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="grid grid-cols-3 gap-3 mb-6"
        >
          {[
            { label: 'Invite Team', icon: UserPlus, action: () => setInviteOpen(true) },
            { label: 'Add Contact', icon: Users,    action: () => router.push('/contacts') },
            { label: 'Create Deal', icon: Briefcase, action: () => router.push('/deals') },
          ].map(({ label, icon: Icon, action }) => (
            <button key={label} onClick={action}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border/40 bg-card/50 hover:border-primary/40 hover:bg-primary/5 transition-all group">
              <Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">{label}</span>
            </button>
          ))}
        </motion.div>

        {/* Go to Dashboard */}
        <motion.button
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          onClick={() => router.replace('/dashboard')}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-base hover:bg-primary/90 active:scale-[0.98] transition-all shadow-lg shadow-primary/20"
        >
          Go to Dashboard <ArrowRight className="w-5 h-5" />
        </motion.button>

        <p className="text-center text-xs text-muted-foreground mt-4">
          You can always return to this checklist from{' '}
          <span className="text-foreground font-medium">Settings → Organization</span>
        </p>
      </div>

      {/* Invite modal */}
      <AnimatePresence>
        {inviteOpen && (
          <InviteModal onClose={() => { setInviteOpen(false); loadCounts(); }} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Invite Modal (inline) ─────────────────────────────────────────────────────

function InviteModal({ onClose }: { onClose: () => void }) {
  const { addToast } = useUI();
  const [email,        setEmail]        = useState('');
  const [roleId,       setRoleId]       = useState('');
  const [roles,        setRoles]        = useState<{ id: string; name: string; displayName: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError]               = useState('');

  useEffect(() => {
    apiFetch('/organization/roles').then((r) => setRoles(r ?? [])).catch(() => {});
  }, []);

  const invitableRoles = roles.filter((r) => ['admin', 'sales_manager', 'sales_rep', 'marketing', 'support'].includes(r.name));

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !roleId) return;
    setError('');
    setIsSubmitting(true);
    try {
      await apiFetch('/invitations', { method: 'POST', body: JSON.stringify({ email, roleId }) });
      addToast({ type: 'success', message: `Invitation sent to ${email}` });
      onClose();
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.toLowerCase().includes('already exists')) {
        setError(msg);
      } else {
        addToast({ type: 'error', message: msg || 'Failed to send invitation.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92 }}
        className="w-full max-w-md bg-card border border-border/40 rounded-2xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <UserPlus className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">Invite Team Member</h3>
            <p className="text-xs text-muted-foreground">Send an invitation link to join your workspace</p>
          </div>
        </div>

        <form onSubmit={handleSend} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email Address</label>
            <input
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@company.com"
              className="w-full bg-muted/40 border border-border/40 rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/60 transition-colors"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</label>
            <select
              required value={roleId} onChange={(e) => setRoleId(e.target.value)}
              className="w-full bg-muted/40 border border-border/40 rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/60 transition-colors"
            >
              <option value="">Select a role...</option>
              {invitableRoles.map((r) => (
                <option key={r.id} value={r.id}>{r.displayName}</option>
              ))}
            </select>
          </div>
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-600">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted/40 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting || !email || !roleId}
              className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:pointer-events-none">
              {isSubmitting ? 'Sending...' : 'Send Invite'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
