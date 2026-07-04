'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, List, LayoutGridIcon } from 'lucide-react';
import KanbanBoard from '@/components/deals/kanban-board';
import Card from '@/components/ui/card';
import Modal from '@/components/ui/modal';
import { useUI } from '@/lib/context';
import { useDeals, useContacts } from '@/lib/hooks';
import { DEAL_STAGES, type DealStage, type DealPriority, type DealCloseReason } from '@/lib/types';
import { CURRENCIES } from '@/lib/regions';

const PRIORITIES: DealPriority[] = ['low', 'medium', 'high'];
const STAGES = Object.entries(DEAL_STAGES).map(([k, v]) => ({ value: k as DealStage, label: v.label }));

// ─── New / Edit Deal Modal ────────────────────────────────────────────────────
function DealModal({
  isOpen,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Record<string, any>) => Promise<void>;
}) {
  const { addToast } = useUI();
  const { contacts } = useContacts();
  const [form, setForm] = useState({
    title: '', contactId: '', value: '', currency: 'USD',
    stage: 'new' as DealStage, priority: 'medium' as DealPriority,
    expectedCloseDate: '', notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) setForm({ title: '', contactId: '', value: '', currency: 'USD', stage: 'new', priority: 'medium', expectedCloseDate: '', notes: '' });
  }, [isOpen]);

  const set = (k: keyof typeof form, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.value) {
      addToast({ type: 'error', message: 'Title and value are required.' });
      return;
    }
    setIsSubmitting(true);
    try {
      await onSave({
        title: form.title,
        contactId: form.contactId || undefined,
        value: parseFloat(form.value),
        currency: form.currency,
        stage: form.stage,
        priority: form.priority,
        expectedCloseDate: form.expectedCloseDate || undefined,
        notes: form.notes || undefined,
      });
      onClose();
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'Failed to create deal.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inp = 'w-full bg-muted/40 border border-border/40 rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/60 transition-colors';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Deal" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Deal Title *</label>
          <input className={inp} value={form.title} onChange={e => set('title', e.target.value)} placeholder="Enterprise License Deal" required />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Value *</label>
            <input type="number" min="0" className={inp} value={form.value} onChange={e => set('value', e.target.value)} placeholder="50000" required />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Currency</label>
            <select className={inp} value={form.currency} onChange={e => set('currency', e.target.value)}>
              {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Stage</label>
            <select className={inp} value={form.stage} onChange={e => set('stage', e.target.value as DealStage)}>
              {STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Priority</label>
            <select className={inp} value={form.priority} onChange={e => set('priority', e.target.value as DealPriority)}>
              {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contact</label>
            <select className={inp} value={form.contactId} onChange={e => set('contactId', e.target.value)}>
              <option value="">No contact</option>
              {contacts.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Expected Close</label>
            <input type="date" className={inp} value={form.expectedCloseDate} onChange={e => set('expectedCloseDate', e.target.value)} />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notes</label>
          <textarea className={`${inp} resize-none`} rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Deal notes..." />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted/50 transition-colors">Cancel</button>
          <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
            {isSubmitting ? 'Creating...' : 'Create Deal'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Close Deal Modal ─────────────────────────────────────────────────────────
function CloseDealModal({
  isOpen,
  onClose,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: DealCloseReason) => Promise<void>;
}) {
  const [outcome,      setOutcome]      = useState<'won' | 'lost'>('won');
  const [reason,       setReason]       = useState<DealCloseReason>('won');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const REASONS_WON:  DealCloseReason[] = ['won'];
  const REASONS_LOST: DealCloseReason[] = ['lost', 'no_decision', 'cancelled'];

  useEffect(() => { setReason(outcome === 'won' ? 'won' : 'lost'); }, [outcome]);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try { await onConfirm(reason); onClose(); }
    finally { setIsSubmitting(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Close Deal" size="sm">
      <div className="space-y-4">
        <div className="flex gap-3">
          {(['won', 'lost'] as const).map(o => (
            <button key={o} type="button" onClick={() => setOutcome(o)}
              className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${
                outcome === o
                  ? o === 'won' ? 'bg-green-600 text-white border-green-600' : 'bg-destructive text-white border-destructive'
                  : 'bg-muted/30 border-border/40 text-muted-foreground hover:border-primary/40'
              }`}>
              {o === 'won' ? '🏆 Won' : '❌ Lost'}
            </button>
          ))}
        </div>

        {outcome === 'lost' && (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reason</label>
            <select
              value={reason}
              onChange={e => setReason(e.target.value as DealCloseReason)}
              className="w-full bg-muted/40 border border-border/40 rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/60"
            >
              {REASONS_LOST.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
            </select>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted/50 transition-colors">Cancel</button>
          <button onClick={handleConfirm} disabled={isSubmitting}
            className={`flex-1 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-50 ${outcome === 'won' ? 'bg-green-600 hover:bg-green-700' : 'bg-destructive hover:bg-destructive/90'}`}>
            {isSubmitting ? 'Closing...' : `Mark as ${outcome === 'won' ? 'Won' : 'Lost'}`}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Deals Page ───────────────────────────────────────────────────────────────
export default function DealsPage() {
  const { addToast }  = useUI();
  const { createDeal, updateDealStage } = useDeals();
  const [viewMode,    setViewMode]    = useState<'kanban' | 'list'>('kanban');
  const [newOpen,     setNewOpen]     = useState(false);
  const [closeOpen,   setCloseOpen]   = useState(false);
  const [closeDealId, setCloseDealId] = useState<string | null>(null);

  const handleCreate = async (data: Record<string, any>) => {
    await createDeal(data);
    addToast({ type: 'success', message: 'Deal created successfully.' });
  };

  const handleCloseDeal = async (reason: DealCloseReason) => {
    if (!closeDealId) return;
    const stage: DealStage = reason === 'won' ? 'closed_won' : 'closed_lost';
    await updateDealStage(closeDealId, stage, reason);
    addToast({ type: 'success', message: `Deal marked as ${reason === 'won' ? 'won 🏆' : 'lost'}.` });
    setCloseDealId(null);
  };

  return (
    <motion.div className="p-4 sm:p-6 space-y-4 sm:space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Pipeline</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">Manage your sales deals and track progress</p>
        </div>
        <button
          onClick={() => setNewOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          New Deal
        </button>
      </div>

      {/* View toggle */}
      <Card className="flex items-center gap-2">
        {(['kanban', 'list'] as const).map(mode => (
          <button key={mode} onClick={() => setViewMode(mode)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${viewMode === mode ? 'bg-primary text-primary-foreground' : 'hover:bg-accent/10 text-foreground'}`}>
            {mode === 'kanban' ? <><LayoutGridIcon className="w-4 h-4" /> Kanban</> : <><List className="w-4 h-4" /> List</>}
          </button>
        ))}
      </Card>

      {viewMode === 'kanban' && (
        <KanbanBoard
          onCloseDeal={(id) => { setCloseDealId(id); setCloseOpen(true); }}
        />
      )}

      {/* Modals */}
      <DealModal isOpen={newOpen} onClose={() => setNewOpen(false)} onSave={handleCreate} />
      <CloseDealModal
        isOpen={closeOpen && !!closeDealId}
        onClose={() => { setCloseOpen(false); setCloseDealId(null); }}
        onConfirm={handleCloseDeal}
      />
    </motion.div>
  );
}
