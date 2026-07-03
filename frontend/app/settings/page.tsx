'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  User, Lock, Building2, Bell, Users, Mail,
  Plus, Trash2, Shield, Crown, ChevronDown, X, Clock, SlidersHorizontal,
} from 'lucide-react';
import Card, { CardHeader } from '@/components/ui/card';
import Badge from '@/components/ui/badge';
import Modal from '@/components/ui/modal';
import { useAuth, useUI } from '@/lib/context';
import { useTeamMembers, useInvitations, useRoles, useOrganization } from '@/lib/hooks';
import { INVITE_PERMISSIONS } from '@/lib/rbac';
import { CURRENCIES } from '@/lib/regions';
import { apiFetch } from '@/lib/api';

// ─── Role badge colour mapping ────────────────────────────────────────────────
const ROLE_BADGE: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'> = {
  owner:         'error',
  admin:         'warning',
  sales_manager: 'primary',
  sales_rep:     'info',
  marketing:     'success',
  support:       'default',
};

// ─── Invite Modal ─────────────────────────────────────────────────────────────
function InviteModal({
  isOpen,
  onClose,
  myRoleName,
}: {
  isOpen:      boolean;
  onClose:     () => void;
  myRoleName:  string;
}) {
  const { roles }                       = useRoles();
  const { sendInvitation }              = useInvitations();
  const { addToast }                    = useUI();
  const [email, setEmail]               = useState('');
  const [roleId, setRoleId]             = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Only show roles this user is allowed to invite
  const allowedRoleNames: string[] = INVITE_PERMISSIONS[myRoleName] ?? [];
  const invitableRoles = roles.filter((r) => allowedRoleNames.includes(r.name));

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
      addToast({ type: 'error', message: err.message || 'Failed to send invitation' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Invite Team Member" description="They'll receive a link to join your organization." size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email Address</label>
          <div className="flex items-center gap-2 bg-muted/40 border border-border/40 rounded-lg px-3 py-2.5">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <input
              type="email"
              placeholder="colleague@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1 bg-transparent outline-none text-sm text-foreground"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</label>
          <div className="relative">
            <select
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              required
              className="w-full bg-muted/40 border border-border/40 rounded-lg px-3 py-2.5 text-sm text-foreground outline-none appearance-none pr-8"
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

// ─── Edit Profile Form ────────────────────────────────────────────────────────
function EditProfileForm() {
  const { user, refreshUser } = useAuth();
  const { addToast } = useUI();
  const [name,        setName]        = useState(user?.name ?? '');
  const [avatarUrl,   setAvatarUrl]   = useState(user?.avatar && !/^[A-Z]{1,2}$/.test(user.avatar) ? user.avatar : '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inp = 'w-full bg-muted/40 border border-border/40 rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/60 transition-colors';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { addToast({ type: 'error', message: 'Name cannot be empty.' }); return; }
    setIsSubmitting(true);
    try {
      await apiFetch('/auth/me', {
        method: 'PATCH',
        body: JSON.stringify({ name: name.trim(), avatar: avatarUrl.trim() || undefined }),
      });
      await refreshUser();
      addToast({ type: 'success', message: 'Profile updated.' });
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'Failed to update profile.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-2">
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Display Name</label>
        <input className={inp} value={name} onChange={e => setName(e.target.value)} placeholder="Sarah Chen" required />
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Avatar URL <span className="font-normal normal-case text-muted-foreground/60">(optional)</span></label>
        <input type="url" className={inp} value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} placeholder="https://example.com/photo.jpg" />
      </div>
      <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
        {isSubmitting ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  );
}

// ─── Org Edit Form ────────────────────────────────────────────────────────────
function OrgEditForm({
  org,
  onSave,
}: {
  org: any;
  onSave: (updates: { name?: string; country?: string; currency?: string; timezone?: string; website?: string }) => Promise<void>;
}) {
  const { addToast } = useUI();
  const [name,        setName]        = useState(org?.name ?? '');
  const [country,     setCountry]     = useState(org?.country ?? '');
  const [currency,    setCurrency]    = useState(org?.currency ?? '');
  const [timezone,    setTimezone]    = useState(org?.timezone ?? '');
  const [website,     setWebsite]     = useState(org?.website ?? '');
  const [submitting,  setSubmitting]  = useState(false);

  const inp = 'w-full bg-muted/40 border border-border/40 rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/60 transition-colors';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { addToast({ type: 'error', message: 'Organization name is required.' }); return; }
    setSubmitting(true);
    try {
      await onSave({ name: name.trim(), country, currency, timezone, website: website.trim() || undefined });
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'Failed to update organization.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-2">
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Organization Name *</label>
        <input className={inp} value={name} onChange={e => setName(e.target.value)} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Country</label>
          <input className={inp} value={country} onChange={e => setCountry(e.target.value)} placeholder="US" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Currency</label>
          <select className={inp} value={currency} onChange={e => setCurrency(e.target.value)}>
            {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>)}
          </select>
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Timezone</label>
        <input className={inp} value={timezone} onChange={e => setTimezone(e.target.value)} placeholder="UTC" />
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Website <span className="font-normal normal-case text-muted-foreground/60">(optional)</span></label>
        <input type="url" className={inp} value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://company.com" />
      </div>
      <button type="submit" disabled={submitting} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
        {submitting ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  );
}

// ─── Change Password Form ─────────────────────────────────────────────────────
function ChangePasswordForm() {
  const { addToast } = useUI();
  const [current,   setCurrent]   = useState('');
  const [newPw,     setNewPw]     = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [submitting, setSubmitting] = useState(false);

  const inp = 'w-full bg-muted/40 border border-border/40 rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/60 transition-colors';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw.length < 8) { addToast({ type: 'error', message: 'New password must be at least 8 characters.' }); return; }
    if (newPw !== confirm)  { addToast({ type: 'error', message: 'Passwords do not match.' }); return; }
    setSubmitting(true);
    try {
      await apiFetch('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword: current, newPassword: newPw }),
      });
      addToast({ type: 'success', message: 'Password changed successfully.' });
      setCurrent(''); setNewPw(''); setConfirm('');
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'Failed to change password.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-2">
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Current Password</label>
        <input type="password" className={inp} value={current} onChange={e => setCurrent(e.target.value)} required />
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">New Password</label>
        <input type="password" className={inp} value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Min 8 characters" required />
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Confirm New Password</label>
        <input type="password" className={`${inp} ${confirm && newPw !== confirm ? 'border-red-500/60' : confirm && newPw === confirm ? 'border-green-500/60' : ''}`} value={confirm} onChange={e => setConfirm(e.target.value)} required />
        {confirm && newPw !== confirm && <p className="text-xs text-red-500">Passwords do not match</p>}
      </div>
      <button type="submit" disabled={submitting} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
        {submitting ? 'Updating...' : 'Update Password'}
      </button>
    </form>
  );
}

// ─── Main Settings Page ───────────────────────────────────────────────────────
export default function SettingsPage() {
  const { user, hasPermission }         = useAuth();
  const { addToast }                    = useUI();
  const searchParams                    = useSearchParams();
  const { members, isLoading: membersLoading, deactivateUser, changeRole } = useTeamMembers();
  const { invitations, isLoading: invLoading, revokeInvitation, resendInvitation } = useInvitations();
  const { roles }                       = useRoles();
  const { organization, updateOrganization } = useOrganization();
  const [inviteOpen, setInviteOpen]     = useState(false);

  // Read tab from URL query param (?tab=preferences etc.)
  const tabFromUrl = searchParams.get('tab');
  const validTabs = ['profile', 'team', 'organization', 'security', 'notifications', 'preferences'] as const;
  type TabId = typeof validTabs[number];
  const initialTab: TabId = validTabs.includes(tabFromUrl as TabId) ? (tabFromUrl as TabId) : 'profile';
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);

  // Sync if URL changes
  useEffect(() => {
    if (tabFromUrl && validTabs.includes(tabFromUrl as TabId)) {
      setActiveTab(tabFromUrl as TabId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabFromUrl]);

  const canInvite    = hasPermission('user.invite');
  const canManage    = hasPermission('user.update') || hasPermission('user.remove');
  const myRoleName   = user?.role?.name ?? '';

  // ── Preferences state (localStorage-backed) ──────────────────────────────
  const [prefTheme,      setPrefTheme]      = useState('system');
  const [prefLanguage,   setPrefLanguage]   = useState('en');
  const [prefTimezone,   setPrefTimezone]   = useState('UTC');
  const [prefDateFormat, setPrefDateFormat] = useState('MM/DD/YYYY');
  const [prefTimeFormat, setPrefTimeFormat] = useState('12h');
  const [prefCurrency,   setPrefCurrency]   = useState('USD');

  useEffect(() => {
    setPrefTheme(localStorage.getItem('pref_theme')      ?? 'system');
    setPrefLanguage(localStorage.getItem('pref_language')   ?? 'en');
    setPrefTimezone(localStorage.getItem('pref_timezone')   ?? 'UTC');
    setPrefDateFormat(localStorage.getItem('pref_dateFormat') ?? 'MM/DD/YYYY');
    setPrefTimeFormat(localStorage.getItem('pref_timeFormat') ?? '12h');
    setPrefCurrency(localStorage.getItem('pref_currency')   ?? 'USD');
  }, []);

  const handleSavePreferences = () => {
    localStorage.setItem('pref_theme',      prefTheme);
    localStorage.setItem('pref_language',   prefLanguage);
    localStorage.setItem('pref_timezone',   prefTimezone);
    localStorage.setItem('pref_dateFormat', prefDateFormat);
    localStorage.setItem('pref_timeFormat', prefTimeFormat);
    localStorage.setItem('pref_currency',   prefCurrency);
    // Apply theme
    if (prefTheme === 'dark') document.documentElement.classList.add('dark');
    else if (prefTheme === 'light') document.documentElement.classList.remove('dark');
    else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
    }
    addToast({ type: 'success', message: 'Preferences saved.' });
  };

  const tabs = [
    { id: 'profile' as const,       label: 'Profile',       icon: User },
    { id: 'team' as const,          label: 'Team',          icon: Users },
    { id: 'organization' as const,  label: 'Organization',  icon: Building2 },
    { id: 'security' as const,      label: 'Security',      icon: Lock },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'preferences' as const,   label: 'Preferences',   icon: SlidersHorizontal },
  ];

  return (
    <motion.div
      className="p-6 space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and team</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Profile Tab ─────────────────────────────────────────────────── */}
      {activeTab === 'profile' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg space-y-4">
          {/* ── View card ── */}
          <Card>
            <CardHeader title="Profile" description="Your personal account information" />
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xl font-bold overflow-hidden">
                {user?.avatar && !/^[A-Z]{1,2}$/.test(user.avatar) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  user?.name?.slice(0, 2).toUpperCase()
                )}
              </div>
              <div>
                <p className="font-semibold text-foreground">{user?.name}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <Badge variant={ROLE_BADGE[myRoleName] ?? 'default'} size="sm" className="mt-1">
                  {user?.role?.displayName}
                </Badge>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Full Name',    value: user?.name },
                { label: 'Email',        value: user?.email },
                { label: 'Role',         value: user?.role?.displayName },
                { label: 'Organization', value: user?.organization?.name },
                { label: 'Account Type', value: user?.isOwner ? 'Organization Owner' : 'Member' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <span className="text-sm font-medium text-foreground">{item.value ?? '—'}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* ── Edit Profile ── */}
          <Card>
            <CardHeader title="Edit Profile" description="Update your display name and avatar" />
            <EditProfileForm />
          </Card>

          {/* ── Change Password ── */}
          <Card>
            <CardHeader title="Change Password" description="Use a strong password of at least 8 characters" action={<Shield className="w-5 h-5 text-primary" />} />
            <ChangePasswordForm />
          </Card>
        </motion.div>
      )}

      {/* ── Team Tab ────────────────────────────────────────────────────── */}
      {activeTab === 'team' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

          {/* Members list */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Team Members</h3>
                <p className="text-sm text-muted-foreground mt-0.5">{members.length} member{members.length !== 1 ? 's' : ''} in your organization</p>
              </div>
              {canInvite && (
                <button
                  onClick={() => setInviteOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Invite Member
                </button>
              )}
            </div>

            {membersLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-lg bg-muted/30 animate-pulse" />)}
              </div>
            ) : (
              <div className="space-y-2">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center text-xs font-bold text-foreground">
                        {member.avatar || member.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground">{member.name}</p>
                          {member.isOwner && <Crown className="w-3.5 h-3.5 text-yellow-500" />}
                          {!member.isActive && <Badge variant="error" size="sm">Inactive</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge variant={ROLE_BADGE[(member.role as any)?.name ?? ''] ?? 'default'} size="sm">
                        {(member.role as any)?.displayName ?? member.role}
                      </Badge>

                      {/* Only show controls if I can manage AND it's not myself AND not the owner */}
                      {canManage && member.id !== user?.id && !member.isOwner && (
                        <div className="flex items-center gap-1">
                          {/* Change role dropdown */}
                          {hasPermission('user.update') && (
                            <div className="relative">
                              <select
                                defaultValue=""
                                onChange={async (e) => {
                                  if (!e.target.value) return;
                                  try {
                                    await changeRole(member.id, e.target.value);
                                    addToast({ type: 'success', message: 'Role updated successfully' });
                                  } catch (err: any) {
                                    addToast({ type: 'error', message: err.message || 'Failed to update role.' });
                                  }
                                  e.target.value = '';
                                }}
                                className="text-xs bg-muted/50 border border-border/40 rounded px-2 py-1 outline-none cursor-pointer"
                              >
                                <option value="">Change role</option>
                                {roles
                                  .filter((r) => !['owner'].includes(r.name))
                                  .map((r) => (
                                    <option key={r.id} value={r.id}>{r.displayName}</option>
                                  ))}
                              </select>
                            </div>
                          )}

                          {/* Deactivate */}
                          {hasPermission('user.remove') && (
                            <button
                              onClick={async () => {
                                if (!confirm(`Deactivate ${member.name}?`)) return;
                                try {
                                  await deactivateUser(member.id);
                                  addToast({ type: 'success', message: 'User deactivated' });
                                } catch (err: any) {
                                  addToast({ type: 'error', message: err.message || 'Failed to deactivate user.' });
                                }
                              }}
                              className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                              title="Deactivate user"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Pending Invitations */}
          {canInvite && (
            <Card>
              <CardHeader
                title="Pending Invitations"
                description="Invites that haven't been accepted yet"
                action={
                  <Badge variant="default" size="sm">
                    {invitations.length} pending
                  </Badge>
                }
              />

              {invLoading ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => <div key={i} className="h-12 rounded-lg bg-muted/30 animate-pulse" />)}
                </div>
              ) : invitations.length === 0 ? (
                <div className="text-center py-8">
                  <Mail className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No pending invitations</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {invitations.map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Mail className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{inv.email}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant={ROLE_BADGE[inv.role?.name ?? ''] ?? 'default'} size="sm">
                              {inv.role?.displayName}
                            </Badge>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Expires {new Date(inv.expiresAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          try {
                            await resendInvitation(inv.id);
                            addToast({ type: 'success', message: `Invitation resent to ${inv.email}` });
                          } catch (err: any) {
                            addToast({ type: 'error', message: err.message || 'Failed to resend invitation.' });
                          }
                        }}
                        className="p-1.5 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                        title="Resend invitation"
                      >
                        <Mail className="w-4 h-4" />
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            await revokeInvitation(inv.id);
                            addToast({ type: 'success', message: 'Invitation revoked' });
                          } catch (err: any) {
                            addToast({ type: 'error', message: err.message || 'Failed to revoke invitation.' });
                          }
                        }}
                        className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title="Revoke invitation"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Role Legend */}
          <Card>
            <CardHeader title="Role Permissions" description="What each role can do in your organization" />
            <div className="space-y-3">
              {[
                { name: 'owner',         display: 'Owner',            desc: 'Full access — billing, org settings, everything', color: 'error' as const },
                { name: 'admin',         display: 'Admin',            desc: 'Manage users, settings, all CRM data. Cannot delete org', color: 'warning' as const },
                { name: 'sales_manager', display: 'Sales Manager',    desc: 'Full CRM access, view team data and reports', color: 'primary' as const },
                { name: 'sales_rep',     display: 'Sales Rep',        desc: 'Create and manage own contacts, deals, activities', color: 'info' as const },
                { name: 'marketing',     display: 'Marketing',        desc: 'Import contacts, view analytics and reports', color: 'success' as const },
                { name: 'support',       display: 'Support',          desc: 'View customers, manage support activities', color: 'default' as const },
              ].map((r) => (
                <div key={r.name} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                  <Badge variant={r.color} size="sm" className="mt-0.5 min-w-fit">{r.display}</Badge>
                  <p className="text-sm text-muted-foreground">{r.desc}</p>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* ── Organization Tab ────────────────────────────────────────────── */}
      {activeTab === 'organization' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg space-y-4">
          {/* View */}
          <Card>
            <CardHeader title="Organization" description="Your organization details" action={<Building2 className="w-5 h-5 text-primary" />} />
            <div className="space-y-3">
              {[
                { label: 'Name',         value: organization?.name },
                { label: 'Industry',     value: organization?.industry ?? '—' },
                { label: 'Company Size', value: organization?.companySize ?? '—' },
                { label: 'Country',      value: organization?.country },
                { label: 'Currency',     value: organization?.currency },
                { label: 'Timezone',     value: organization?.timezone },
                { label: 'Website',      value: organization?.website ?? '—' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <span className="text-sm font-medium text-foreground">{item.value}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Edit — owner only */}
          {user?.isOwner && (
            <Card>
              <CardHeader title="Edit Organization" description="Update your organization settings" />
              <OrgEditForm
                org={organization}
                onSave={async (updates) => {
                  await updateOrganization(updates);
                  addToast({ type: 'success', message: 'Organization updated.' });
                }}
              />
            </Card>
          )}
        </motion.div>
      )}

      {/* ── Security Tab ────────────────────────────────────────────────── */}
      {activeTab === 'security' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg space-y-4">
          <Card>
            <CardHeader title="Security" description="Manage your password and account security" action={<Shield className="w-5 h-5 text-primary" />} />
            <div className="space-y-3">
              {[
                { label: 'Password',        value: '••••••••' },
                { label: 'Two-Factor Auth', value: 'Disabled' },
                { label: 'Last Login',      value: user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'N/A' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <span className="text-sm font-medium text-foreground">{item.value}</span>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium">
              Change Password
            </button>
          </Card>
        </motion.div>
      )}

      {/* ── Notifications Tab ───────────────────────────────────────────── */}
      {activeTab === 'notifications' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg">
          <Card>
            <CardHeader title="Notifications" description="Control your notification preferences" action={<Bell className="w-5 h-5 text-primary" />} />
            <div className="space-y-3">
              {[
                { label: 'Email Alerts',  value: 'Enabled' },
                { label: 'Deal Updates',  value: 'Enabled' },
                { label: 'Task Reminders', value: 'Enabled' },
                { label: 'Weekly Report', value: 'Disabled' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <Badge variant={item.value === 'Enabled' ? 'success' : 'default'} size="sm">{item.value}</Badge>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* ── Preferences Tab ─────────────────────────────────────────────── */}
      {activeTab === 'preferences' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg space-y-4">
          <Card>
            <CardHeader title="Preferences" description="Personalise your workspace experience" action={<SlidersHorizontal className="w-5 h-5 text-primary" />} />

            {/* Theme */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Theme</label>
                <select value={prefTheme} onChange={(e) => setPrefTheme(e.target.value)}
                  className="w-full bg-muted/40 border border-border/40 rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/60 transition-colors">
                  {[{v:'system',l:'System'},{v:'light',l:'Light'},{v:'dark',l:'Dark'}].map(o=>(
                    <option key={o.v} value={o.v}>{o.l}</option>
                  ))}
                </select>
              </div>

              {/* Language */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Language</label>
                <select value={prefLanguage} onChange={(e) => setPrefLanguage(e.target.value)}
                  className="w-full bg-muted/40 border border-border/40 rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/60 transition-colors">
                  {[{v:'en',l:'English'},{v:'es',l:'Spanish'},{v:'fr',l:'French'},{v:'de',l:'German'},{v:'ar',l:'Arabic'}].map(o=>(
                    <option key={o.v} value={o.v}>{o.l}</option>
                  ))}
                </select>
              </div>

              {/* Timezone */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Timezone</label>
                <select value={prefTimezone} onChange={(e) => setPrefTimezone(e.target.value)}
                  className="w-full bg-muted/40 border border-border/40 rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/60 transition-colors">
                  {[
                    {v:'UTC',l:'UTC'},
                    {v:'America/New_York',l:'Eastern Time (US & Canada)'},
                    {v:'America/Chicago',l:'Central Time (US & Canada)'},
                    {v:'America/Los_Angeles',l:'Pacific Time (US & Canada)'},
                    {v:'Europe/London',l:'London (GMT)'},
                    {v:'Europe/Paris',l:'Paris, Berlin, Rome (CET)'},
                    {v:'Asia/Dubai',l:'Dubai (GST)'},
                    {v:'Asia/Kolkata',l:'Mumbai, Delhi (IST)'},
                    {v:'Asia/Singapore',l:'Singapore (SGT)'},
                    {v:'Asia/Tokyo',l:'Tokyo (JST)'},
                    {v:'Australia/Sydney',l:'Sydney (AEST)'},
                  ].map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
                </select>
              </div>

              {/* Date Format */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date Format</label>
                <select value={prefDateFormat} onChange={(e) => setPrefDateFormat(e.target.value)}
                  className="w-full bg-muted/40 border border-border/40 rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/60 transition-colors">
                  {[
                    {v:'MM/DD/YYYY',l:'MM/DD/YYYY (e.g. 07/25/2025)'},
                    {v:'DD/MM/YYYY',l:'DD/MM/YYYY (e.g. 25/07/2025)'},
                    {v:'YYYY-MM-DD',l:'YYYY-MM-DD (e.g. 2025-07-25)'},
                  ].map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
                </select>
              </div>

              {/* Time Format */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Time Format</label>
                <div className="flex gap-3">
                  {['12h','24h'].map((fmt)=>(
                    <button key={fmt} type="button" onClick={() => setPrefTimeFormat(fmt)}
                      className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${
                        prefTimeFormat === fmt ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/30 border-border/40 text-muted-foreground hover:border-primary/40'
                      }`}>
                      {fmt === '12h' ? '12-hour (AM/PM)' : '24-hour'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Currency */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Display Currency</label>
                <select value={prefCurrency} onChange={(e) => setPrefCurrency(e.target.value)}
                  className="w-full bg-muted/40 border border-border/40 rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/60 transition-colors">
                  {CURRENCIES.map(c=>(
                    <option key={c.code} value={c.code}>{c.symbol} {c.name} ({c.code})</option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleSavePreferences}
                className="w-full mt-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
              >
                Save Preferences
              </button>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Invite Modal */}
      <InviteModal
        isOpen={inviteOpen}
        onClose={() => setInviteOpen(false)}
        myRoleName={myRoleName}
      />
    </motion.div>
  );
}
