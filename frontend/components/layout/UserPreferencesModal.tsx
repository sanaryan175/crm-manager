'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/modal';
import { useUI } from '@/lib/context';
import { CURRENCIES } from '@/lib/regions';

const TIMEZONES = [
  { value: 'UTC',                 label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York',    label: 'Eastern Time (US & Canada)' },
  { value: 'America/Chicago',     label: 'Central Time (US & Canada)' },
  { value: 'America/Denver',      label: 'Mountain Time (US & Canada)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)' },
  { value: 'Europe/London',       label: 'London (GMT)' },
  { value: 'Europe/Paris',        label: 'Paris, Berlin, Rome (CET)' },
  { value: 'Europe/Istanbul',     label: 'Istanbul (TRT)' },
  { value: 'Asia/Dubai',          label: 'Dubai (GST)' },
  { value: 'Asia/Kolkata',        label: 'Mumbai, Delhi (IST)' },
  { value: 'Asia/Singapore',      label: 'Singapore (SGT)' },
  { value: 'Asia/Tokyo',          label: 'Tokyo (JST)' },
  { value: 'Australia/Sydney',    label: 'Sydney (AEST)' },
];

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'ar', label: 'Arabic' },
];

const DATE_FORMATS = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY  (e.g. 07/25/2025)' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY  (e.g. 25/07/2025)' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD  (e.g. 2025-07-25)' },
];

const THEMES = [
  { value: 'system', label: 'System' },
  { value: 'light',  label: 'Light' },
  { value: 'dark',   label: 'Dark' },
];

function applyTheme(theme: string) {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else if (theme === 'light') {
    root.classList.remove('dark');
  } else {
    // system
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) root.classList.add('dark');
    else root.classList.remove('dark');
  }
}

const SELECT_CLS =
  'w-full bg-muted/40 border border-border/40 rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/60 transition-colors';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function UserPreferencesModal({ isOpen, onClose }: Props) {
  const { addToast } = useUI();

  const [theme,      setTheme]      = useState('system');
  const [language,   setLanguage]   = useState('en');
  const [timezone,   setTimezone]   = useState('UTC');
  const [dateFormat, setDateFormat] = useState('MM/DD/YYYY');
  const [timeFormat, setTimeFormat] = useState('12h');
  const [currency,   setCurrency]   = useState('USD');

  // Load saved prefs from localStorage when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setTheme(localStorage.getItem('pref_theme')      ?? 'system');
    setLanguage(localStorage.getItem('pref_language')   ?? 'en');
    setTimezone(localStorage.getItem('pref_timezone')   ?? 'UTC');
    setDateFormat(localStorage.getItem('pref_dateFormat') ?? 'MM/DD/YYYY');
    setTimeFormat(localStorage.getItem('pref_timeFormat') ?? '12h');
    setCurrency(localStorage.getItem('pref_currency')   ?? 'USD');
  }, [isOpen]);

  const handleSave = () => {
    localStorage.setItem('pref_theme',      theme);
    localStorage.setItem('pref_language',   language);
    localStorage.setItem('pref_timezone',   timezone);
    localStorage.setItem('pref_dateFormat', dateFormat);
    localStorage.setItem('pref_timeFormat', timeFormat);
    localStorage.setItem('pref_currency',   currency);
    applyTheme(theme);
    addToast({ type: 'success', message: 'Preferences saved.' });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Preferences"
      description="Customize your personal workspace experience."
      size="md"
    >
      <div className="space-y-4">

        {/* Theme */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Theme</label>
          <select value={theme} onChange={(e) => setTheme(e.target.value)} className={SELECT_CLS}>
            {THEMES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        {/* Language */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Language</label>
          <select value={language} onChange={(e) => setLanguage(e.target.value)} className={SELECT_CLS}>
            {LANGUAGES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
        </div>

        {/* Timezone */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Timezone</label>
          <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className={SELECT_CLS}>
            {TIMEZONES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        {/* Date Format */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date Format</label>
          <select value={dateFormat} onChange={(e) => setDateFormat(e.target.value)} className={SELECT_CLS}>
            {DATE_FORMATS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
        </div>

        {/* Time Format */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Time Format</label>
          <div className="flex gap-3">
            {['12h', '24h'].map((fmt) => (
              <button
                key={fmt}
                type="button"
                onClick={() => setTimeFormat(fmt)}
                className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${
                  timeFormat === fmt
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-muted/30 border-border/40 text-muted-foreground hover:border-primary/40'
                }`}
              >
                {fmt === '12h' ? '12-hour (AM/PM)' : '24-hour'}
              </button>
            ))}
          </div>
        </div>

        {/* Currency */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Display Currency</label>
          <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={SELECT_CLS}>
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>{c.symbol} {c.name} ({c.code})</option>
            ))}
          </select>
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
            type="button"
            onClick={handleSave}
            className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </Modal>
  );
}
