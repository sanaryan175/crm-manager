'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, CheckCircle, Users, Briefcase, BarChart3,
  CheckSquare, Shield, Zap, ChevronDown, ChevronUp, Menu, X,
  Building2, TrendingUp, Target, Activity, Sparkles,
} from 'lucide-react';
import { useAuth } from '@/lib/context';

// ─── Data ─────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: Users,
    title: 'Contact Management',
    desc: 'Centralize every customer. Tag, filter, and track interactions across your full contact database instantly.',
    color: 'text-blue-400',
    gradient: 'from-blue-500/20 to-blue-600/5',
    border: 'group-hover:border-blue-500/30',
  },
  {
    icon: Briefcase,
    title: 'Visual Deal Pipeline',
    desc: 'Drag-and-drop kanban board across every sales stage. See exactly where each deal stands at a glance.',
    color: 'text-violet-400',
    gradient: 'from-violet-500/20 to-violet-600/5',
    border: 'group-hover:border-violet-500/30',
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    desc: 'Invite your team with role-based access. Owners, admins, sales managers, reps — everyone gets exactly what they need.',
    color: 'text-emerald-400',
    gradient: 'from-emerald-500/20 to-emerald-600/5',
    border: 'group-hover:border-emerald-500/30',
  },
  {
    icon: BarChart3,
    title: 'Reports & Analytics',
    desc: 'Real-time pipeline metrics, conversion rates, and revenue forecasts. Make data-driven decisions effortlessly.',
    color: 'text-amber-400',
    gradient: 'from-amber-500/20 to-amber-600/5',
    border: 'group-hover:border-amber-500/30',
  },
  {
    icon: Activity,
    title: 'Activity Tracking',
    desc: 'Log calls, meetings, emails, and tasks. Never miss a follow-up with automated reminders and due-date tracking.',
    color: 'text-pink-400',
    gradient: 'from-pink-500/20 to-pink-600/5',
    border: 'group-hover:border-pink-500/30',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    desc: 'Multi-tenant architecture with granular RBAC permissions. Your data stays yours — isolated and encrypted.',
    color: 'text-cyan-400',
    gradient: 'from-cyan-500/20 to-cyan-600/5',
    border: 'group-hover:border-cyan-500/30',
  },
];

const STEPS = [
  {
    num: '01',
    title: 'Create your account',
    desc: 'Sign up with your work email in under 60 seconds. No credit card required.',
    icon: Zap,
  },
  {
    num: '02',
    title: 'Set up your workspace',
    desc: 'Configure your organization — industry, currency, timezone — in a guided 3-step wizard.',
    icon: Building2,
  },
  {
    num: '03',
    title: 'Invite your team & start closing',
    desc: 'Send role-specific invitations. Your team onboards themselves and you start winning together.',
    icon: TrendingUp,
  },
];

const TESTIMONIALS = [
  {
    quote: 'We closed 40% more deals in our first month. The pipeline view finally made our process visible to the whole team.',
    name: 'Priya Sharma',
    role: 'VP of Sales',
    company: 'NovaTech Solutions',
    initials: 'PS',
    color: 'from-violet-500 to-purple-600',
  },
  {
    quote: 'The invitation and role system made onboarding our 12-person team completely painless. Everyone got exactly the right access.',
    name: 'Marcus Chen',
    role: 'Sales Director',
    company: 'Elevate Commerce',
    initials: 'MC',
    color: 'from-blue-500 to-cyan-600',
  },
  {
    quote: 'Finally a CRM that actually makes sense. Clean UI, fast, and the role-based dashboard means my reps see only what matters.',
    name: 'Aisha Okafor',
    role: 'Founder & CEO',
    company: 'GrowthLoop',
    initials: 'AO',
    color: 'from-emerald-500 to-teal-600',
  },
];

const FAQS = [
  {
    q: 'Is CRM Manager free to get started?',
    a: "Yes. You can create your account, set up your organization, and invite your full team at no cost. Start building your pipeline immediately without a credit card.",
  },
  {
    q: 'Can I import my existing contacts?',
    a: 'CSV import is on the product roadmap. In the meantime, you can create contacts manually or via our API. Bulk operations are fully supported.',
  },
  {
    q: 'How does the role-based access work?',
    a: 'There are 6 built-in roles: Owner, Admin, Sales Manager, Sales Rep, Marketing, and Support. Each role has a carefully curated permission set. Owners can invite anyone; Admins can invite below them; Sales Managers can invite reps. The hierarchy is strictly enforced.',
  },
  {
    q: 'How many team members can I invite?',
    a: 'There is no hard cap on team members. You can invite as many colleagues as your business needs. Each person gets a unique invitation link that expires in 72 hours for security.',
  },
  {
    q: 'Is my data isolated from other organizations?',
    a: 'Absolutely. CRM Manager uses a strict multi-tenant architecture. Every piece of data — contacts, deals, activities — is scoped to your organization. No cross-contamination, ever.',
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border/40 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-muted/20 transition-colors"
      >
        <span className="font-medium text-foreground text-sm sm:text-base">{q}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0 ml-4" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <p className="px-6 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border/30 pt-4">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const router   = useRouter();
  const { user, isLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Auth redirect
  useEffect(() => {
    if (isLoading || !user) return;
    const orgSetupComplete       = user.organization?.setupComplete ?? false;
    const userOnboardingComplete = user.onboardingComplete ?? false;
    if (user.isOwner && !orgSetupComplete) { router.replace('/onboarding/setup'); return; }
    if (!user.isOwner && !userOnboardingComplete) { router.replace('/onboarding/user'); return; }
    router.replace('/dashboard');
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }
  if (user) return null;

  const fadeUp = {
    hidden:  { opacity: 0, y: 24 },
    visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Background ─────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[700px] h-[700px] bg-primary/8 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-40 w-[500px] h-[500px] bg-accent/8 rounded-full blur-3xl" />
      </div>

      {/* ── Navbar ─────────────────────────────────────────── */}
      <header className="fixed top-0 inset-x-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="text-white text-sm font-black">C</span>
            </div>
            <span className="font-black text-lg tracking-tight">CRM</span>
          </div>

          {/* Nav links — desktop */}
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            {[['#features', 'Features'], ['#how-it-works', 'How it works'], ['#faq', 'FAQ']].map(([href, label]) => (
              <a key={href} href={href} className="hover:text-foreground transition-colors">{label}</a>
            ))}
          </nav>

          {/* CTA buttons — desktop */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => router.push('/login')}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Log In
            </button>
            <button
              onClick={() => router.push('/login?mode=register')}
              className="flex items-center gap-1.5 px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 active:scale-95 transition-all shadow-lg shadow-primary/20"
            >
              Get Started Free <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur-xl overflow-hidden"
            >
              <div className="px-4 py-4 space-y-3">
                {[['#features', 'Features'], ['#how-it-works', 'How it works'], ['#faq', 'FAQ']].map(([href, label]) => (
                  <a key={href} href={href} onClick={() => setMobileMenuOpen(false)}
                    className="block py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">{label}</a>
                ))}
                <div className="pt-3 border-t border-border/40 space-y-2">
                  <button onClick={() => router.push('/login')} className="w-full py-2.5 text-sm font-medium border border-border rounded-lg hover:bg-muted/30 transition-colors">
                    Log In
                  </button>
                  <button onClick={() => router.push('/login?mode=register')} className="w-full py-2.5 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                    Get Started Free
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="relative pt-32 pb-24 sm:pt-40 sm:pb-32 px-4 text-center">
        <motion.div custom={0} initial="hidden" animate="visible" variants={fadeUp}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          Built for modern sales teams
        </motion.div>

        <motion.h1 custom={1} initial="hidden" animate="visible" variants={fadeUp}
          className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-tight mb-6">
          Close More Deals.<br />
          <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Build Lasting Relationships.
          </span>
        </motion.h1>

        <motion.p custom={2} initial="hidden" animate="visible" variants={fadeUp}
          className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          The CRM built for ambitious teams. Manage contacts, track your pipeline,
          and collaborate seamlessly — from your first lead to your biggest deal.
        </motion.p>

        <motion.div custom={3} initial="hidden" animate="visible" variants={fadeUp}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <button
            onClick={() => router.push('/login?mode=register')}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-lg hover:bg-primary/90 active:scale-[0.98] transition-all shadow-2xl shadow-primary/25"
          >
            Start for Free <ArrowRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => router.push('/login')}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-muted/30 border border-border/50 text-foreground font-semibold text-lg hover:bg-muted/50 active:scale-[0.98] transition-all"
          >
            Sign In
          </button>
        </motion.div>

        {/* Stats strip */}
        <motion.div custom={4} initial="hidden" animate="visible" variants={fadeUp}
          className="flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
          {['500+ active teams', '50,000+ deals tracked', '6 built-in roles', '99.9% uptime'].map((stat) => (
            <div key={stat} className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              {stat}
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── Features ───────────────────────────────────────── */}
      <section id="features" className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
              className="text-primary text-sm font-semibold uppercase tracking-widest mb-3">Features</motion.p>
            <motion.h2 initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="text-3xl sm:text-4xl font-black tracking-tight mb-4">
              Everything you need to close more deals
            </motion.h2>
            <motion.p initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
              className="text-muted-foreground max-w-2xl mx-auto">
              Purpose-built for sales teams of every size. No feature bloat — just the tools that move the needle.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07 }}
                  whileHover={{ y: -4 }}
                  className={`group relative p-6 rounded-2xl border border-border/40 bg-gradient-to-br ${f.gradient} ${f.border} transition-all duration-300 cursor-default`}
                >
                  <div className={`inline-flex p-3 rounded-xl bg-background/60 border border-border/40 mb-4 ${f.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-foreground mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-4 border-y border-border/30 bg-muted/10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
              className="text-primary text-sm font-semibold uppercase tracking-widest mb-3">Get started</motion.p>
            <motion.h2 initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="text-3xl sm:text-4xl font-black tracking-tight">
              Up and running in minutes
            </motion.h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12 }}
                  className="text-center"
                >
                  <div className="relative inline-flex">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5 mx-auto">
                      <Icon className="w-8 h-8 text-primary" />
                    </div>
                    <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-black flex items-center justify-center">
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="font-bold text-foreground mb-2 text-lg">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Testimonials ───────────────────────────────────── */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <motion.h2 initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="text-3xl sm:text-4xl font-black tracking-tight mb-4">
              Loved by sales teams
            </motion.h2>
            <div className="flex items-center justify-center gap-1 text-amber-400">
              {[...Array(5)].map((_, i) => <span key={i} className="text-xl">★</span>)}
              <span className="ml-2 text-sm text-muted-foreground">4.9 / 5 from 200+ reviews</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-2xl bg-card/60 border border-border/40 flex flex-col gap-4"
              >
                <p className="text-sm text-muted-foreground leading-relaxed flex-1">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role} · {t.company}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────── */}
      <section id="faq" className="py-24 px-4 border-t border-border/30 bg-muted/10">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
              className="text-primary text-sm font-semibold uppercase tracking-widest mb-3">FAQ</motion.p>
            <motion.h2 initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="text-3xl sm:text-4xl font-black tracking-tight">
              Frequently asked questions
            </motion.h2>
          </div>
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="space-y-3">
            {FAQS.map((faq, i) => <FAQItem key={i} q={faq.q} a={faq.a} />)}
          </motion.div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────── */}
      <section className="py-24 px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center bg-gradient-to-br from-primary/20 via-primary/10 to-accent/10 border border-primary/20 rounded-3xl p-12 sm:p-16"
        >
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-4">
            Ready to grow your pipeline?
          </h2>
          <p className="text-muted-foreground mb-10 max-w-xl mx-auto">
            Join hundreds of sales teams already using CRM Manager to close more deals and build lasting relationships.
          </p>
          <button
            onClick={() => router.push('/login?mode=register')}
            className="inline-flex items-center gap-2 px-10 py-4 bg-primary text-primary-foreground rounded-xl font-bold text-lg hover:bg-primary/90 active:scale-[0.98] transition-all shadow-2xl shadow-primary/30"
          >
            Start for Free Today <ArrowRight className="w-5 h-5" />
          </button>
          <p className="mt-4 text-xs text-muted-foreground">No credit card required · Set up in 5 minutes</p>
        </motion.div>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="border-t border-border/40 py-10 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-black">C</span>
            </div>
            <span className="font-black">CRM Manager</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
            <button onClick={() => router.push('/login')} className="hover:text-foreground transition-colors">Login</button>
          </div>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} CRM Manager. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
