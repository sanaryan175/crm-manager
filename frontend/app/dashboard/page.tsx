'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Mail, ChevronDown } from 'lucide-react';
import DashboardMetrics from '@/components/dashboard/metrics';
import PipelineOverview from '@/components/dashboard/pipeline-overview';
import RecentActivities from '@/components/dashboard/recent-activities';
import QuickStats from '@/components/dashboard/quick-stats';
import ProfileCompletionModal from '@/components/profile/ProfileCompletionModal';
import Modal from '@/components/ui/modal';
import { useAuth, useUI } from '@/lib/context';
import { useInvitations, useRoles } from '@/lib/hooks';
import { INVITE_PERMISSIONS } from '@/lib/rbac';

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
        className="p-6 space-y-6"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back{user ? `, ${user.name.split(' ')[0]}` : ''}! Here&apos;s your sales overview.
            </p>
          </div>
          {hasPermission('user.invite') && (
            <button
              onClick={() => setInviteOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex-shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              Invite Member
            </button>
          )}
        </motion.div>

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
