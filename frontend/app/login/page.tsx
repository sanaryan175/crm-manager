'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Sparkles, CheckCircle } from 'lucide-react';
import { useAuth, useUI } from '@/lib/context';
import Card from '@/components/ui/card';

export default function LoginPage() {
  const router = useRouter();
  const { user, login, register, isLoading } = useAuth();
  const { addToast } = useUI();

  const [mode, setMode]                       = useState<'login' | 'register'>('login');
  const [name, setName]                       = useState('');
  const [email, setEmail]                     = useState('');
  const [password, setPassword]               = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword]       = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);
  const [isSubmitting, setIsSubmitting]       = useState(false);

  // Redirect if already logged in (handles session restore and post-login state update)
  useEffect(() => {
    if (!user) return;
    
    const orgSetupComplete = user.organization?.setupComplete ?? false;
    const userOnboardingComplete = user.onboardingComplete ?? true;

    // Owner without org setup → go to org setup wizard
    if (user.isOwner && !orgSetupComplete) {
      router.replace('/onboarding/setup');
      return;
    }

    // Invited user without onboarding complete → go to user onboarding
    if (!user.isOwner && !userOnboardingComplete) {
      router.replace('/onboarding/user');
      return;
    }

    // All authenticated users with complete setup → go to dashboard
    router.replace('/dashboard');
  }, [user, router]);

  // Password strength indicator
  const passwordStrength = (() => {
    if (password.length === 0) return null;
    if (password.length < 8)   return { label: 'Too short', color: 'bg-red-500', width: 'w-1/4' };
    if (password.length < 12)  return { label: 'Fair', color: 'bg-yellow-500', width: 'w-2/4' };
    if (/[A-Z]/.test(password) && /[0-9]/.test(password))
                               return { label: 'Strong', color: 'bg-green-500', width: 'w-full' };
    return { label: 'Good', color: 'bg-blue-500', width: 'w-3/4' };
  })();

  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'register') {
      if (!name.trim()) {
        addToast({ type: 'error', message: 'Please enter your full name.' });
        return;
      }
      if (password.length < 8) {
        addToast({ type: 'error', message: 'Password must be at least 8 characters.' });
        return;
      }
      if (password !== confirmPassword) {
        addToast({ type: 'error', message: 'Passwords do not match.' });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (mode === 'login') {
        const { user: loggedInUser } = await login(email, password);
        addToast({ type: 'success', message: `Welcome back, ${loggedInUser.name.split(' ')[0]}!` });
        // Explicitly route based on user type and onboarding state
        const orgSetupComplete = loggedInUser.organization?.setupComplete ?? false;
        const userOnboardingComplete = loggedInUser.onboardingComplete ?? true;

        if (loggedInUser.isOwner && !orgSetupComplete) {
          router.replace('/onboarding/setup');
        } else if (!loggedInUser.isOwner && !userOnboardingComplete) {
          router.replace('/onboarding/user');
        } else {
          router.replace('/dashboard');
        }
      } else {
        const result = await register(name, email, password, confirmPassword);
        addToast({ type: 'success', message: 'Account created! Let\'s set up your organization.' });
        // Always go to setup after register — org is not configured yet
        router.replace('/onboarding/setup');
        return;
      }
    } catch (err: any) {
      if (mode === 'login') {
        const msg: string = err.message ?? '';
        const lower = msg.toLowerCase();
        if (lower.includes('invalid') || lower.includes('credentials') || lower.includes('password')) {
          addToast({ type: 'error', message: 'Invalid email or password. Please check your credentials and try again.' });
        } else if (lower.includes('not found') || lower.includes('does not exist') || lower.includes('no user')) {
          addToast({ type: 'error', message: 'No account found with this email. Please register first.' });
          setTimeout(() => setMode('register'), 500);
        } else if (lower.includes('account') && (lower.includes('inactive') || lower.includes('deactivated'))) {
          addToast({ type: 'error', message: 'Your account has been deactivated. Please contact your administrator.' });
        } else {
          addToast({ type: 'error', message: msg || 'Something went wrong. Please try again.' });
        }
      } else {
        const msg: string = err.message ?? '';
        const lower = msg.toLowerCase();
        if (lower.includes('already exists') || lower.includes('email')) {
          addToast({ type: 'error', message: 'An account with this email already exists. Sign in instead.' });
          setTimeout(() => setMode('login'), 500);
        } else {
          addToast({ type: 'error', message: msg || 'Something went wrong. Please try again.' });
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden select-none">
      {/* Background glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/15 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo + heading */}
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 bg-gradient-to-br from-primary to-accent rounded-2xl items-center justify-center text-white font-bold text-2xl mb-4 shadow-lg shadow-primary/30">
            C
          </div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            {mode === 'login'
              ? 'Sign in to your workspace'
              : 'Step 1 of 2 — Your personal details'}
          </p>
        </div>

        {/* Step indicator for register */}
        {mode === 'register' && (
          <div className="flex items-center gap-2 mb-6 px-1">
            <div className="flex items-center gap-2 flex-1">
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-white">1</div>
              <div className="flex-1 h-0.5 bg-primary" />
              <div className="w-7 h-7 rounded-full bg-muted border-2 border-border flex items-center justify-center text-xs font-medium text-muted-foreground">2</div>
            </div>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span className="text-primary font-medium">Your details</span>
              <span>Org setup</span>
            </div>
          </div>
        )}

        <Card className="border border-border/40 backdrop-blur-md bg-card/60 p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Name — register only */}
            <AnimatePresence initial={false}>
              {mode === 'register' && (
                <motion.div
                  key="name"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-1.5 overflow-hidden"
                >
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Full Name
                  </label>
                  <div className="flex items-center gap-2 bg-muted/40 border border-border/40 rounded-lg px-3 py-2.5 focus-within:border-primary/60 transition-colors">
                    <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <input
                      type="text"
                      placeholder="Sarah Chen"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="name"
                      className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground/50"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Work Email
              </label>
              <div className="flex items-center gap-2 bg-muted/40 border border-border/40 rounded-lg px-3 py-2.5 focus-within:border-primary/60 transition-colors">
                <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <input
                  type="email"
                  placeholder="sarah@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground/50"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Password
              </label>
              <div className="flex items-center gap-2 bg-muted/40 border border-border/40 rounded-lg px-3 py-2.5 focus-within:border-primary/60 transition-colors">
                <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  required
                  className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground/50"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Forgot password — login only */}
              {mode === 'login' && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => addToast({ type: 'info', message: 'Password reset coming soon.' })}
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {/* Password strength — register only */}
              {mode === 'register' && passwordStrength && (
                <div className="space-y-1 pt-1">
                  <div className="h-1 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${passwordStrength.color}`}
                      initial={{ width: 0 }}
                      animate={{ width: passwordStrength.width }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{passwordStrength.label}</p>
                </div>
              )}
            </div>
            {/* Confirm Password — register only */}
            <AnimatePresence initial={false}>
              {mode === 'register' && (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-1.5 overflow-hidden"
                >
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Confirm Password
                  </label>
                  <div className={`flex items-center gap-2 bg-muted/40 border rounded-lg px-3 py-2.5 focus-within:border-primary/60 transition-colors ${
                    passwordsMismatch ? 'border-red-500/60' : passwordsMatch ? 'border-green-500/60' : 'border-border/40'
                  }`}>
                    <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                      className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground/50"
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="text-muted-foreground hover:text-foreground transition-colors">
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    {passwordsMatch && <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />}
                  </div>
                  {passwordsMismatch && (
                    <p className="text-xs text-red-500">Passwords do not match</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none mt-2"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <>
                  {mode === 'login' ? 'Sign In' : 'Continue to Setup'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Toggle */}
          <div className="mt-6 text-center border-t border-border/30 pt-5">
            <button
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setPassword(''); setConfirmPassword(''); }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {mode === 'login' ? (
                <>Don&apos;t have an account? <span className="text-primary font-semibold hover:underline">Create one free</span></>
              ) : (
                <>Already have an account? <span className="text-primary font-semibold hover:underline">Sign in</span></>
              )}
            </button>
          </div>
        </Card>

        {/* Demo hint */}
        {mode === 'login' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-4 p-4 bg-muted/20 border border-border/20 rounded-xl text-xs text-muted-foreground text-center"
          >
            <span className="font-semibold text-foreground flex items-center justify-center gap-1.5 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-yellow-500 animate-pulse" />
              Demo Credentials
            </span>
            <code className="text-foreground">sarah@company.com</code> / <code className="text-foreground">password123</code>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
