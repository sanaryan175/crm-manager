'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, Globe, Users, DollarSign, Clock,
  ChevronRight, ChevronLeft, CheckCircle, Briefcase,
} from 'lucide-react';
import { useAuth, useUI } from '@/lib/context';
import { apiFetch } from '@/lib/api';
import { CURRENCIES, COUNTRIES } from '@/lib/regions';
import Card from '@/components/ui/card';

// ─── Timezone list (common ones) ──────────────────────────────────────────────
const TIMEZONES = [
  { value: 'UTC',                  label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York',     label: 'Eastern Time (US & Canada)' },
  { value: 'America/Chicago',      label: 'Central Time (US & Canada)' },
  { value: 'America/Denver',       label: 'Mountain Time (US & Canada)' },
  { value: 'America/Los_Angeles',  label: 'Pacific Time (US & Canada)' },
  { value: 'Europe/London',        label: 'London (GMT)' },
  { value: 'Europe/Paris',         label: 'Paris, Berlin, Rome (CET)' },
  { value: 'Europe/Istanbul',      label: 'Istanbul (TRT)' },
  { value: 'Asia/Dubai',           label: 'Dubai (GST)' },
  { value: 'Asia/Kolkata',         label: 'Mumbai, Delhi (IST)' },
  { value: 'Asia/Singapore',       label: 'Singapore (SGT)' },
  { value: 'Asia/Tokyo',           label: 'Tokyo (JST)' },
  { value: 'Australia/Sydney',     label: 'Sydney (AEST)' },
];

const INDUSTRIES = [
  'Technology', 'SaaS / Software', 'Finance & Banking', 'Healthcare',
  'Real Estate', 'Retail & E-commerce', 'Manufacturing', 'Education',
  'Marketing & Advertising', 'Consulting', 'Legal', 'Other',
];

const COMPANY_SIZES = [
  '1–10 employees', '11–50 employees', '51–200 employees',
  '201–500 employees', '501–1000 employees', '1000+ employees',
];

const FISCAL_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// ─── Step definitions ─────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Organization',  icon: Building2 },
  { id: 2, label: 'Regional',      icon: Globe },
  { id: 3, label: 'Team',          icon: Users },
];

export default function SetupPage() {
  const router = useRouter();
  const { user, isLoading, refreshUser } = useAuth();
  const { addToast } = useUI();

  const [step, setStep]           = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [form, setForm] = useState({
    name:        '',
    industry:    '',
    companySize: '',
    website:     '',
    phone:       '',
    address:     '',
    country:     'US',
    currency:    'USD',
    timezone:    'UTC',
    fiscalYear:  1,
  });

  // Auto-suggest currency + timezone when country changes
  const handleCountryChange = (countryCode: string) => {
    const country = COUNTRIES.find((c) => c.code === countryCode);
    setForm((prev) => ({
      ...prev,
      country:  countryCode,
      currency: country?.defaultCurrency ?? prev.currency,
      timezone: TIMEZONES.find((t) =>
        t.value.toLowerCase().includes(countryCode.toLowerCase())
      )?.value ?? prev.timezone,
    }));
  };

  const set = (key: keyof typeof form, value: any) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // Guard: only owner with incomplete setup can be here
  useEffect(() => {
    if (isLoading) return;
    if (!user) { router.replace('/login'); return; }
    // Only owners can access org setup
    if (!user.isOwner) { router.replace('/dashboard'); return; }
    // If setup already complete, go to dashboard
    if (user.organization?.setupComplete) {
      router.replace('/dashboard');
    }
  }, [user, isLoading, router]);

  const handleFinish = async () => {
    if (!form.name.trim()) {
      addToast({ type: 'error', message: 'Organization name is required.' });
      return;
    }
    if (!form.industry) {
      addToast({ type: 'error', message: 'Please select an industry.' });
      return;
    }
    if (!form.companySize) {
      addToast({ type: 'error', message: 'Please select company size.' });
      return;
    }

    setIsSubmitting(true);
    try {
      // Strip empty optional strings so backend URL validator doesn't reject them
      const payload = {
        ...form,
        website: form.website.trim() || undefined,
        phone:   form.phone.trim()   || undefined,
        address: form.address.trim() || undefined,
      };
      await apiFetch('/auth/setup', {
        method: 'POST',
        body:   JSON.stringify(payload),
      });
      await refreshUser();
      addToast({ type: 'success', message: 'Organization setup complete!' });
      router.replace('/dashboard');
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'Setup failed. Please try again.' });
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

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary opacity-60" />
      <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-2xl relative z-10">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl items-center justify-center text-white font-bold text-xl mb-4 shadow-lg shadow-primary/20">
            C
          </div>
          <h1 className="text-3xl font-extrabold text-foreground">Set up your organization</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Step 2 of 2 — Tell us about your company so we can configure your CRM correctly
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center mb-8 px-2">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const done    = step > s.id;
            const current = step === s.id;
            return (
              <React.Fragment key={s.id}>
                <div className="flex flex-col items-center gap-1 min-w-0">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300 text-sm sm:text-base ${
                    done    ? 'bg-green-500 text-white' :
                    current ? 'bg-primary text-white ring-4 ring-primary/20' :
                              'bg-muted text-muted-foreground'
                  }`}>
                    {done ? <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" /> : <Icon className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </div>
                  <span className={`text-[10px] sm:text-xs font-medium whitespace-nowrap ${current ? 'text-primary' : done ? 'text-green-500' : 'text-muted-foreground'}`}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 sm:mx-3 mb-4 sm:mb-5 transition-colors ${step > s.id ? 'bg-green-500' : 'bg-border'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Step content */}
        <Card className="p-8 shadow-2xl border border-border/40 bg-card/80 backdrop-blur-sm">
          <AnimatePresence mode="wait">

            {/* ── Step 1: Organization Details ── */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-primary" /> Organization Details
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">Basic information about your company</p>
                </div>

                {/* Organization Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Organization Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Acme Corp"
                    value={form.name}
                    onChange={(e) => set('name', e.target.value)}
                    className="w-full bg-muted/40 border border-border/40 rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/60 transition-colors"
                  />
                </div>

                {/* Industry */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Industry <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.industry}
                    onChange={(e) => set('industry', e.target.value)}
                    className="w-full bg-muted/40 border border-border/40 rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/60 transition-colors"
                  >
                    <option value="">Select industry...</option>
                    {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>

                {/* Company Size */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Company Size <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {COMPANY_SIZES.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => set('companySize', size)}
                        className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                          form.companySize === size
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-muted/30 border-border/40 text-muted-foreground hover:border-primary/40 hover:text-foreground'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Website (optional) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Website <span className="text-muted-foreground font-normal normal-case">(optional)</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://company.com"
                    value={form.website}
                    onChange={(e) => set('website', e.target.value)}
                    className="w-full bg-muted/40 border border-border/40 rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/60 transition-colors"
                  />
                </div>

                {/* Phone (optional) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Phone <span className="text-muted-foreground font-normal normal-case">(optional)</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={form.phone}
                    onChange={(e) => set('phone', e.target.value)}
                    className="w-full bg-muted/40 border border-border/40 rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/60 transition-colors"
                  />
                </div>
              </motion.div>
            )}

            {/* ── Step 2: Regional Settings ── */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <Globe className="w-5 h-5 text-primary" /> Regional Settings
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Selecting a country will auto-suggest currency and timezone — you can adjust them freely.
                  </p>
                </div>

                {/* Country */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Country <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.country}
                    onChange={(e) => handleCountryChange(e.target.value)}
                    className="w-full bg-muted/40 border border-border/40 rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/60 transition-colors"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Currency */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Base Currency <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.currency}
                    onChange={(e) => set('currency', e.target.value)}
                    className="w-full bg-muted/40 border border-border/40 rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/60 transition-colors"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>{c.symbol} {c.name} ({c.code})</option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">Used for displaying deal values and revenue across the CRM</p>
                </div>

                {/* Timezone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Default Timezone <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.timezone}
                    onChange={(e) => set('timezone', e.target.value)}
                    className="w-full bg-muted/40 border border-border/40 rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/60 transition-colors"
                  >
                    {TIMEZONES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                {/* Fiscal Year */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Fiscal Year Start
                  </label>
                  <select
                    value={form.fiscalYear}
                    onChange={(e) => set('fiscalYear', parseInt(e.target.value))}
                    className="w-full bg-muted/40 border border-border/40 rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/60 transition-colors"
                  >
                    {FISCAL_MONTHS.map((m, i) => (
                      <option key={i + 1} value={i + 1}>{m}</option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">Used for financial reports and revenue calculations</p>
                </div>
              </motion.div>
            )}

            {/* ── Step 3: Review & Confirm ── */}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-primary" /> Review & Confirm
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">Everything looks good? Hit Finish to create your workspace.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: 'Organization',  value: form.name },
                    { label: 'Industry',      value: form.industry },
                    { label: 'Company Size',  value: form.companySize },
                    { label: 'Country',       value: COUNTRIES.find((c) => c.code === form.country)?.name ?? form.country },
                    { label: 'Currency',      value: `${CURRENCIES.find((c) => c.code === form.currency)?.symbol} ${form.currency}` },
                    { label: 'Timezone',      value: form.timezone },
                    { label: 'Fiscal Year',   value: `${FISCAL_MONTHS[form.fiscalYear - 1]}` },
                    { label: 'Website',       value: form.website || '—' },
                  ].map((item) => (
                    <div key={item.label} className="flex flex-col gap-0.5 p-3 rounded-lg bg-muted/30">
                      <span className="text-xs text-muted-foreground">{item.label}</span>
                      <span className="text-sm font-medium text-foreground truncate">{item.value}</span>
                    </div>
                  ))}
                </div>

                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">What happens next?</p>
                  <ul className="space-y-1 text-xs list-disc list-inside">
                    <li>Your organization workspace will be created</li>
                    <li>You will land on your dashboard as the Owner</li>
                    <li>You can invite Admins, Sales Managers, and more from Settings → Team</li>
                    <li>All settings can be changed later from Settings</li>
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border/30">
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              disabled={step === 1}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:border-border/80 transition-colors disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>

            {step < STEPS.length ? (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                className="flex items-center gap-2 px-6 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 active:scale-[0.98] transition-all"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <><CheckCircle className="w-4 h-4" /> Finish Setup</>
                )}
              </button>
            )}
          </div>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          You can change all of these settings later from <span className="text-foreground font-medium">Settings → Organization</span>
        </p>
      </div>
    </div>
  );
}
