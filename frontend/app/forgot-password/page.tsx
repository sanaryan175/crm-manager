'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Lock, KeyRound, ArrowLeft, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { useUI } from '@/lib/context';
import { apiFetch } from '@/lib/api';
import Card from '@/components/ui/card';

type Step = 'email' | 'pin' | 'password';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { addToast } = useUI();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSendPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiFetch('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setStep('pin');
      addToast({ type: 'success', message: 'If that email exists, a 6-digit PIN has been sent.' });
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'Something went wrong' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 6) return;
    setStep('password');
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      addToast({ type: 'error', message: 'Passwords do not match' });
      return;
    }
    setIsSubmitting(true);
    try {
      await apiFetch('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email, pin, newPassword }),
      });
      addToast({ type: 'success', message: 'Password reset successfully! Please log in.' });
      router.push('/login');
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'Failed to reset password' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="p-8">
          {/* Back to login */}
          <button
            onClick={() => router.push('/login')}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to login
          </button>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            {(['email', 'pin', 'password'] as Step[]).map((s, i) => (
              <React.Fragment key={s}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  step === s
                    ? 'bg-primary text-primary-foreground'
                    : ['email', 'pin', 'password'].indexOf(step) > i
                      ? 'bg-green-500 text-white'
                      : 'bg-muted text-muted-foreground'
                }`}>
                  {['email', 'pin', 'password'].indexOf(step) > i ? <CheckCircle className="w-4 h-4" /> : i + 1}
                </div>
                {i < 2 && <div className={`flex-1 h-0.5 rounded ${['email', 'pin', 'password'].indexOf(step) > i ? 'bg-green-500' : 'bg-muted'}`} />}
              </React.Fragment>
            ))}
          </div>

          {/* Step 1: Email */}
          {step === 'email' && (
            <form onSubmit={handleSendPin} className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-foreground">Forgot Password</h2>
                <p className="text-sm text-muted-foreground mt-1">Enter your email to receive a 6-digit reset PIN.</p>
              </div>
              <div className="flex items-center gap-2 bg-muted/40 border border-border/40 rounded-lg px-3 py-2.5 focus-within:border-primary/60 transition-colors">
                <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground/50"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting || !email}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                Send Reset PIN
              </button>
            </form>
          )}

          {/* Step 2: PIN */}
          {step === 'pin' && (
            <form onSubmit={handleVerifyPin} className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-foreground">Enter Reset PIN</h2>
                <p className="text-sm text-muted-foreground mt-1">A 6-digit PIN was sent to <strong>{email}</strong>. It expires in 10 minutes.</p>
              </div>
              <div className="flex items-center gap-2 bg-muted/40 border border-border/40 rounded-lg px-3 py-2.5 focus-within:border-primary/60 transition-colors">
                <KeyRound className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={pin}
                  onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground/50 tracking-widest font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={pin.length !== 6}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                <ArrowRight className="w-4 h-4" />
                Continue
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSendPin}
                className="w-full text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                Resend PIN
              </button>
            </form>
          )}

          {/* Step 3: New Password */}
          {step === 'password' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-foreground">Set New Password</h2>
                <p className="text-sm text-muted-foreground mt-1">Choose a new password for your account.</p>
              </div>
              <div className="flex items-center gap-2 bg-muted/40 border border-border/40 rounded-lg px-3 py-2.5 focus-within:border-primary/60 transition-colors">
                <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <input
                  type="password"
                  placeholder="New password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground/50"
                />
              </div>
              <div className="flex items-center gap-2 bg-muted/40 border border-border/40 rounded-lg px-3 py-2.5 focus-within:border-primary/60 transition-colors">
                <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground/50"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Reset Password
              </button>
            </form>
          )}
        </Card>
      </motion.div>
    </div>
  );
}