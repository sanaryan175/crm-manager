'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, User, Eye, EyeOff, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { useUI } from '@/lib/context';
import { apiFetch } from '@/lib/api';
import Card from '@/components/ui/card';

export default function AcceptInvitePage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useUI();

  const token = searchParams.get('token') ?? '';

  const [name,            setName]            = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword,    setShowPassword]    = useState(false);
  const [isSubmitting,    setIsSubmitting]    = useState(false);
  const [error,           setError]           = useState('');

  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link. Please request a new invitation.');
    }
  }, [token]);

  const passwordsMatch   = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { addToast({ type: 'error', message: 'Please enter your name.' }); return; }
    if (password.length < 8) { addToast({ type: 'error', message: 'Password must be at least 8 characters.' }); return; }
    if (password !== confirmPassword) { addToast({ type: 'error', message: 'Passwords do not match.' }); return; }

    setIsSubmitting(true);
    try {
      const data = await apiFetch('/invitations/accept', {
        method: 'POST',
        body:   JSON.stringify({ token, name, password }),
      });

      // Store JWT
      if (data?.token && typeof window !== 'undefined') {
        localStorage.setItem('auth_token', data.token);
      }

      addToast({ type: 'success', message: `Welcome to ${data?.organization?.name ?? 'the team'}! Setting up your workspace...`, duration: 4000 });
      // Small delay so the toast is visible before navigation
      setTimeout(() => router.replace('/dashboard'), 1000);
    } catch (err: any) {
      const raw: string = err.message || 'Failed to accept invitation.';
      const lower = raw.toLowerCase();
      let friendly = raw;
      if (lower.includes('expired')) {
        friendly = 'This invitation has expired. Please ask your admin to send a new one.';
      } else if (lower.includes('already') || (lower.includes('email') && lower.includes('exist'))) {
        friendly = 'An account with this email already exists. Please sign in instead.';
      } else if (lower.includes('invalid') || lower.includes('not found')) {
        friendly = 'This invitation link is invalid. It may have already been used or revoked.';
      }
      setError(friendly);
      addToast({ type: 'error', message: friendly });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 bg-gradient-to-br from-primary to-accent rounded-2xl items-center justify-center text-white font-bold text-2xl mb-4 shadow-lg shadow-primary/30">
            C
          </div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
            You&apos;re invited!
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Create your password to join the organization
          </p>
        </div>

        {/* Error state */}
        {error && !token ? (
          <Card className="p-8 text-center border border-red-500/20 bg-red-500/5">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">Invalid Invitation</h2>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <button
              onClick={() => router.push('/login')}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Go to Login
            </button>
          </Card>
        ) : (
          <Card className="border border-border/40 backdrop-blur-md bg-card/60 p-8 shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Your Full Name
                </label>
                <div className="flex items-center gap-2 bg-muted/40 border border-border/40 rounded-lg px-3 py-2.5 focus-within:border-primary/60 transition-colors">
                  <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Sarah Chen"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    required
                    className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground/50"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Create Password
                </label>
                <div className="flex items-center gap-2 bg-muted/40 border border-border/40 rounded-lg px-3 py-2.5 focus-within:border-primary/60 transition-colors">
                  <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                    className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground/50"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-muted-foreground hover:text-foreground transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Confirm Password
                </label>
                <div className={`flex items-center gap-2 bg-muted/40 border rounded-lg px-3 py-2.5 focus-within:border-primary/60 transition-colors ${
                  passwordsMismatch ? 'border-red-500/60' : passwordsMatch ? 'border-green-500/60' : 'border-border/40'
                }`}>
                  <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                    className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground/50"
                  />
                  {passwordsMatch && <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />}
                </div>
                {passwordsMismatch && (
                  <p className="text-xs text-red-500">Passwords do not match</p>
                )}
              </div>

              {/* Error message */}
              {error && token && (
                <div className="flex flex-col gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-500">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                  {error.toLowerCase().includes('already exists') && (
                    <button
                      type="button"
                      onClick={() => router.push('/login')}
                      className="text-xs text-primary underline text-left"
                    >
                      Go to Login →
                    </button>
                  )}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting || !token}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none mt-2"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                ) : (
                  <>Join Organization <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>
          </Card>
        )}
      </motion.div>
    </div>
  );
}
