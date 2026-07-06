'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { UserPlus, Mail, ChevronDown, CheckCircle, Circle, ArrowRight, X, Sparkles, LayoutDashboard, AlertCircle } from 'lucide-react';
import DashboardMetrics from '@/components/dashboard/metrics';
import PipelineOverview from '@/components/dashboard/pipeline-overview';
import RecentActivities from '@/components/dashboard/recent-activities';
import QuickStats from '@/components/dashboard/quick-stats';
import ProfileCompletionModal from '@/components/profile/ProfileCompletionModal';
import FaqModal from '@/components/layout/faq-modal';
import Modal from '@/components/ui/modal';
import { useAuth, useUI } from '@/lib/context';
import { useInvitations, useRoles } from '@/lib/hooks';
import { INVITE_PERMISSIONS } from '@/lib/rbac';
import { apiFetch } from '@/lib/api';

// ─── Invite Member Modal ──────────────────────────────────────────────────────
function InviteMemberModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user }           = useAuth();
  const { addToast }       = useUI();
  const { sendInvitation } = useInvitations();
  const { roles }          = useRoles();

  const [email,        setEmail]        = useState('');
  const [roleId,       setRoleId]       = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const myRoleName: string     = user?.role?.name ?? '';
  const allowedRoleNames: string[] = (INVITE_PERMISSIONS as Record<string, string[]>)[myRoleName] ?? [];
  const invitableRoles         = roles.filter((r) => allowedRoleNames.includes(r.name));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !roleId) return;
    setIsSubmitting(true);
    try {
      await sendInvitation(email, roleId);
      addToast({ type: 'success', message: `Invitation sent to ${email}` });
      setEmail('');
      setRoleId('');
      onClose();
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'Failed to send invitation.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Invite Team Member"
      description="Send an invitation link to join your organization."
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Email Address
          </label>
          <div className="flex items-center gap-2 bg-muted/40 border border-border/40 rounded-lg px-3 py-2.5 focus-within:border-primary/60 transition-colors">
            <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <input
              type="email"
              placeholder="colleague@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground/50"
            />
          </div>
        </div>

        {/* Role */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Role
          </label>
          <div className="relative">
            <select
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              required
              className="w-full bg-muted/40 border border-border/40 rounded-lg px-3 py-2.5 text-sm text-foreground outline-none appearance-none pr-8 focus:border-primary/60 transition-colors"
            >
              <option value="">Select a role...</option>
              {invitableRoles.map((r) => (
                <option key={r.id} value={r.id}>{r.displayName}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
          {invitableRoles.length === 0 && (
            <p className="text-xs text-muted-foreground">Your role cannot invite other members.</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted/50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || invitableRoles.length === 0}
            className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:pointer-events-none"
          >
            {isSubmitting ? 'Sending...' : 'Send Invite'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Role-aware subtitle ───────────────────────────────────────────────────────
const ROLE_SUBTITLES: Record<string, string> = {
  owner:         "this is your organization dashboard",
  admin:         "this is your organization dashboard",
  sales_manager: "this is your team's dashboard",
  sales_rep:     "this is your workspace",
  marketing:     "this is your campaigns overview",
  support:       "this is your support queue",
};

// ─── Dashboard Checklist Widget ────────────────────────────────────────────────
function OnboardingChecklistWidget() {
  const { user, hasPermission } = useAuth();
  const router = useRouter();

  const [counts, setCounts] = useState({ contacts: -1, deals: -1, activities: -1, invitations: -1 });
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const val = typeof window !== 'undefined' ? localStorage.getItem('dismissed_checklist') : null;
    if (val === 'true') setDismissed(true);
  }, []);

  const loadCounts = useCallback(async () => {
    try {
      const [conRes, dealRes, actRes, invRes] = await Promise.allSettled([
        apiFetch('/contacts'),
        apiFetch('/deals'),
        apiFetch('/activities'),
        apiFetch('/invitations'),
      ]);
      setCounts({
        contacts:    conRes.status  === 'fulfilled' ? (conRes.value?.length  ?? 0) : 0,
        deals:       dealRes.status === 'fulfilled' ? (dealRes.value?.length ?? 0) : 0,
        activities:  actRes.status  === 'fulfilled' ? (actRes.value?.length  ?? 0) : 0,
        invitations: invRes.status  === 'fulfilled' ? (invRes.value?.length  ?? 0) : 0,
      });
    } catch {
      setCounts({ contacts: 0, deals: 0, activities: 0, invitations: 0 });
    }
  }, []);

  useEffect(() => { loadCounts(); }, [loadCounts]);

  if (dismissed || counts.contacts === -1) return null;

  const items = [
    ...(hasPermission('user.invite') ? [{ id: 'invite', label: 'Invite a team member', done: counts.invitations > 0, href: '#invite' as const }] : []),
    { id: 'contact',  label: 'Create your first contact',    done: counts.contacts > 0,    href: '/contacts' as const },
    { id: 'deal',     label: 'Create your first deal',       done: counts.deals > 0,       href: '/deals' as const },
    { id: 'activity', label: 'Schedule your first activity', done: counts.activities > 0,  href: '/activities' as const },
  ];

  const allDone = items.every((i) => i.done);
  if (allDone) return null;

  const donePct = Math.round((items.filter((i) => i.done).length / items.length) * 100);

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof window !== 'undefined') localStorage.setItem('dismissed_checklist', 'true');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-primary/10 via-primary/5 to-accent/5 border border-primary/20 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-foreground text-sm">Getting Started</h3>
        </div>
        <button onClick={handleDismiss} className="p-1 rounded-md hover:bg-muted/30 transition-colors">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-2 bg-muted/30 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${donePct}%` }}
            className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
        <span className="text-xs font-medium text-muted-foreground flex-shrink-0">{donePct}%</span>
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 text-sm">
            {item.done ? (
              <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            ) : (
              <Circle className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
            )}
            {item.done ? (
              <span className="text-muted-foreground line-through decoration-muted-foreground/40">{item.label}</span>
            ) : (
              <button
                onClick={() => {
                  if (item.id === 'invite') {
                    document.getElementById('invite-btn')?.click();
                  } else {
                    router.push(item.href!);
                  }
                }}
                className="text-foreground hover:text-primary transition-colors text-left"
              >
                {item.label}
              </button>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user, hasPermission } = useAuth();
  const [inviteOpen, setInviteOpen] = useState(false);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden:   { opacity: 0, y: 20 },
    visible:  { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <>
      {/* Profile Completion Modal — manages its own show/hide state internally */}
      <ProfileCompletionModal />

      {/* Invite Member Modal */}
      <InviteMemberModal isOpen={inviteOpen} onClose={() => setInviteOpen(false)} />

      <motion.div
        className="p-4 sm:p-6 space-y-4 sm:space-y-6"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Welcome back{user ? `, ${user.name.split(' ')[0]}` : ''}!{' '}
              {ROLE_SUBTITLES[user?.role?.name ?? ''] ?? 'Your workspace'}
            </p>
          </div>
          {hasPermission('user.invite') && (
            <button
              id="invite-btn"
              onClick={() => setInviteOpen(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors w-full sm:w-auto"
            >
              <UserPlus className="w-4 h-4" />
              Invite Member
            </button>
          )}
        </motion.div>

        {/* Onboarding Checklist Widget */}
        <OnboardingChecklistWidget />

        {/* Quick Stats */}
        <motion.div variants={itemVariants}>
          <QuickStats />
        </motion.div>

        {/* Metrics Grid */}
        <motion.div variants={itemVariants}>
          <DashboardMetrics />
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <PipelineOverview />
          </motion.div>
          <motion.div variants={itemVariants}>
            <RecentActivities />
          </motion.div>
        </div>
      </motion.div>
    </>
  );
}
