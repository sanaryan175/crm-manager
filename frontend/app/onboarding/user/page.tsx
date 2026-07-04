'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { User, Mail, Building2, CheckCircle, ArrowRight, Bell, Clock, Globe } from 'lucide-react';
import { useAuth, useUI } from '@/lib/context';
import { apiFetch } from '@/lib/api';
import Card from '@/components/ui/card';

export default function UserOnboardingPage() {
  const router = useRouter();
  const { user, isLoading, refreshUser } = useAuth();
  const { addToast } = useUI();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [preferences, setPreferences] = useState({
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: 'en',
    currency: 'USD',
    emailNotifications: true,
    taskReminders: true,
  });

  // Guard: only authenticated non-owners with incomplete onboarding can be here
  useEffect(() => {
    if (isLoading) return;
    if (!user) { router.replace('/login'); return; }
    // Owners should use org setup, not user onboarding
    if (user.isOwner) { router.replace('/onboarding/setup'); return; }
    // If onboarding already complete, go to dashboard
    if (user.onboardingComplete) {
      router.replace('/dashboard');
    }
  }, [user, isLoading, router]);

  const handleCompleteOnboarding = async () => {
    setIsSubmitting(true);
    try {
      await apiFetch('/auth/complete-onboarding', {
        method: 'POST',
        body: JSON.stringify(preferences),
      });
      addToast({ type: 'success', message: 'Welcome to the team! You\'re all set.' });
      await refreshUser();
      router.replace('/dashboard');
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'Failed to complete onboarding. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/15 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-2xl relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-xl items-center justify-center text-white font-bold text-2xl mb-4 shadow-lg shadow-primary/20">
            {user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <h1 className="text-3xl font-extrabold text-foreground">Welcome to the team!</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            You've been invited to join <span className="text-foreground font-medium">{user.organization?.name || 'the organization'}</span>
          </p>
        </div>

        {/* User info card */}
        <Card className="p-8 shadow-2xl border border-border/40 bg-card/80 backdrop-blur-sm mb-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30">
              <User className="w-5 h-5 text-primary flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Your Name</p>
                <p className="text-sm font-medium text-foreground">{user.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30">
              <Mail className="w-5 h-5 text-primary flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Email</p>
                <p className="text-sm font-medium text-foreground">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30">
              <Building2 className="w-5 h-5 text-primary flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Role</p>
                <p className="text-sm font-medium text-foreground">{user.role.displayName}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* What's next */}
        <Card className="p-6 shadow-xl border border-border/40 bg-card/80 backdrop-blur-sm mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">What's next?</h2>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
              <span>Explore your dashboard and get familiar with the CRM</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
              <span>Check out contacts, deals, and activities assigned to you</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
              <span>Update your profile and avatar from Settings</span>
            </li>
          </ul>
        </Card>

        {/* Preferences */}
        <Card className="p-6 shadow-xl border border-border/40 bg-card/80 backdrop-blur-sm mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Your Preferences</h2>
          <div className="space-y-4">
            {/* Language */}
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30">
              <Globe className="w-5 h-5 text-primary flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Language</p>
                <select
                  value={preferences.language}
                  onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                  className="mt-1 w-full bg-transparent text-sm text-foreground outline-none"
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                  <option value="zh">中文</option>
                  <option value="ja">日本語</option>
                </select>
              </div>
            </div>

            {/* Currency */}
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30">
              <Building2 className="w-5 h-5 text-primary flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Currency</p>
                <select
                  value={preferences.currency}
                  onChange={(e) => setPreferences({ ...preferences, currency: e.target.value })}
                  className="mt-1 w-full bg-transparent text-sm text-foreground outline-none"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="INR">INR (₹)</option>
                  <option value="JPY">JPY (¥)</option>
                  <option value="CAD">CAD ($)</option>
                  <option value="AUD">AUD ($)</option>
                </select>
              </div>
            </div>

            {/* Timezone */}
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30">
              <Clock className="w-5 h-5 text-primary flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Timezone</p>
                <p className="text-sm font-medium text-foreground">{preferences.timezone}</p>
              </div>
            </div>

            {/* Email Notifications */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-primary flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Email Notifications</p>
                  <p className="text-xs text-muted-foreground">Receive updates via email</p>
                </div>
              </div>
              <button
                onClick={() => setPreferences({ ...preferences, emailNotifications: !preferences.emailNotifications })}
                className={`w-12 h-6 rounded-full transition-colors ${preferences.emailNotifications ? 'bg-primary' : 'bg-muted'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${preferences.emailNotifications ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>

            {/* Task Reminders */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-primary flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Task Reminders</p>
                  <p className="text-xs text-muted-foreground">Get notified about upcoming tasks</p>
                </div>
              </div>
              <button
                onClick={() => setPreferences({ ...preferences, taskReminders: !preferences.taskReminders })}
                className={`w-12 h-6 rounded-full transition-colors ${preferences.taskReminders ? 'bg-primary' : 'bg-muted'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${preferences.taskReminders ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </div>
        </Card>

        {/* Complete button */}
        <button
          onClick={handleCompleteOnboarding}
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-lg hover:bg-primary/90 active:scale-[0.98] transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:pointer-events-none"
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
          ) : (
            <>
              Get Started
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </motion.div>
    </div>
  );
}
