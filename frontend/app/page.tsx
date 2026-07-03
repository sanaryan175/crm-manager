'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Building2, Users, TrendingUp } from 'lucide-react';
import { useAuth } from '@/lib/context';

export default function Page() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    // If already authenticated, redirect appropriately based on user type and onboarding state
    if (!isLoading && user) {
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
    }
  }, [user, isLoading, router]);

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // If already authenticated, don't show landing page (redirect will happen)
  if (user) {
    return null;
  }

  // Landing page with both login and register options
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/15 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-4xl relative z-10 text-center"
      >
        {/* Logo */}
        <div className="inline-flex w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-2xl items-center justify-center text-white font-bold text-4xl mb-8 shadow-lg shadow-primary/30">
          C
        </div>

        {/* Hero text */}
        <h1 className="text-5xl font-extrabold text-foreground tracking-tight mb-4">
          CRM Manager
        </h1>
        <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
          Manage your sales pipeline, contacts, and deals in one powerful platform
        </p>

        {/* Feature highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { icon: Building2, title: 'Contact Management', desc: 'Organize and track all your contacts' },
            { icon: Users, title: 'Team Collaboration', desc: 'Work together seamlessly' },
            { icon: TrendingUp, title: 'Sales Pipeline', desc: 'Close more deals faster' },
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 + 0.2 }}
              className="p-6 rounded-xl bg-muted/30 border border-border/40"
            >
              <feature.icon className="w-8 h-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            onClick={() => router.push('/login')}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-lg hover:bg-primary/90 active:scale-[0.98] transition-all shadow-lg shadow-primary/20"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </motion.button>

          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            onClick={() => router.push('/login')}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-muted/40 border border-border/40 text-foreground font-semibold text-lg hover:bg-muted/60 hover:border-border/60 active:scale-[0.98] transition-all"
          >
            Sign In
          </motion.button>
        </div>

        {/* Demo hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 p-4 bg-muted/20 border border-border/20 rounded-xl text-sm text-muted-foreground inline-block"
        >
          <span className="font-semibold text-foreground flex items-center justify-center gap-1.5 mb-1">
            <Sparkles className="w-4 h-4 text-yellow-500 animate-pulse" />
            Try Demo
          </span>
          <code className="text-foreground">sarah@company.com</code> / <code className="text-foreground">password123</code>
        </motion.div>
      </motion.div>
    </div>
  );
}
