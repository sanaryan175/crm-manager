'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Building2, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth, useUI } from '@/lib/context';
import Card from '@/components/ui/card';

export default function LoginPage() {
  const router = useRouter();
  const { user, login, register, isLoading } = useAuth();
  const { addToast } = useUI();

  const [isLoginMode, setIsLoginMode]         = useState(true);
  const [orgName, setOrgName]                 = useState('');
  const [name, setName]                       = useState('');
  const [email, setEmail]                     = useState('');
  const [password, setPassword]               = useState('');
  const [isSubmitting, setIsSubmitting]       = useState(false);

  useEffect(() => {
    if (user) router.replace('/dashboard');
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      addToast({ type: 'error', message: 'Please fill in all required fields.' });
      return;
    }
    if (!isLoginMode && (!name || !orgName)) {
      addToast({ type: 'error', message: 'Organization name and your name are required.' });
      return;
    }

    setIsSubmitting(true);
    try {
      if (isLoginMode) {
        await login(email, password);
        addToast({ type: 'success', message: 'Welcome back!' });
      } else {
        await register(orgName, name, email, password);
        addToast({ type: 'success', message: 'Organization created! Welcome to CRM.' });
      }
      router.replace('/dashboard');
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'Authentication failed.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden select-none">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/15 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl items-center justify-center text-white font-bold text-xl mb-4 shadow-lg shadow-primary/20">
            C
          </div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
            {isLoginMode ? 'Welcome back' : 'Create your CRM'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {isLoginMode
              ? 'Sign in to your workspace'
              : 'Set up your organization in seconds'}
          </p>
        </div>

        <Card className="border border-border/40 backdrop-blur-md bg-card/60 p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <AnimatePresence mode="wait">
              {!isLoginMode && (
                <motion.div
                  key="register-fields"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
                  {/* Organization Name */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Organization Name
                    </label>
                    <div className="relative flex items-center bg-muted/40 border border-border/40 rounded-lg px-3 py-2.5 focus-within:border-primary/50 transition-all">
                      <Building2 className="w-4 h-4 text-muted-foreground mr-3 flex-shrink-0" />
                      <input
                        type="text"
                        placeholder="Acme Corp"
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        className="flex-1 bg-transparent outline-none text-sm text-foreground"
                      />
                    </div>
                  </div>
                  {/* Full Name */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Your Full Name
                    </label>
                    <div className="relative flex items-center bg-muted/40 border border-border/40 rounded-lg px-3 py-2.5 focus-within:border-primary/50 transition-all">
                      <User className="w-4 h-4 text-muted-foreground mr-3 flex-shrink-0" />
                      <input
                        type="text"
                        placeholder="Sarah Chen"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="flex-1 bg-transparent outline-none text-sm text-foreground"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative flex items-center bg-muted/40 border border-border/40 rounded-lg px-3 py-2.5 focus-within:border-primary/50 transition-all">
                <Mail className="w-4 h-4 text-muted-foreground mr-3 flex-shrink-0" />
                <input
                  type="email"
                  placeholder="sarah@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-sm text-foreground"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Password
              </label>
              <div className="relative flex items-center bg-muted/40 border border-border/40 rounded-lg px-3 py-2.5 focus-within:border-primary/50 transition-all">
                <Lock className="w-4 h-4 text-muted-foreground mr-3 flex-shrink-0" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-sm text-foreground"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/95 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <>{isLoginMode ? 'Sign In' : 'Create Organization'}<ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <div className="mt-6 text-center border-t border-border/30 pt-5">
            <button
              onClick={() => setIsLoginMode(!isLoginMode)}
              className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {isLoginMode ? (
                <>Don&apos;t have an account? <span className="text-primary font-semibold hover:underline">Create one</span></>
              ) : (
                <>Already have an account? <span className="text-primary font-semibold hover:underline">Sign in</span></>
              )}
            </button>
          </div>
        </Card>

        {isLoginMode && (
          <div className="mt-4 p-4 bg-muted/20 border border-border/20 rounded-lg text-xs text-muted-foreground text-center">
            <span className="font-semibold text-foreground flex items-center justify-center gap-1 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-yellow-500 animate-pulse" />
              Demo Credentials
            </span>
            Email: <code className="text-foreground">sarah@company.com</code> • Password: <code className="text-foreground">password123</code>
          </div>
        )}
      </motion.div>
    </div>
  );
}
