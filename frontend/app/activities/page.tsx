'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, CheckCircle, Trash2, X as XIcon } from 'lucide-react';
import { useActivities, useContacts } from '@/lib/hooks';
import { ACTIVITY_TYPES, type ActivityType } from '@/lib/types';
import Card from '@/components/ui/card';
import Badge from '@/components/ui/badge';
import Modal from '@/components/ui/modal';
import { useFilters, useUI } from '@/lib/context';

// ─── New Activity Modal ───────────────────────────────────────────────────────
function NewActivityModal({
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
    type: 'call' as ActivityType,
    subject: '',
    description: '',
    contactId: '',
    dueDate: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) setForm({ type: 'call', subject: '', description: '', contactId: '', dueDate: '' });
  }, [isOpen]);

  const set = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject.trim()) {
      addToast({ type: 'error', message: 'Subject is required.' });
      return;
    }
    setIsSubmitting(true);
    try {
      await onSave({
        type: form.type,
        subject: form.subject,
        description: form.description || undefined,
        contactId: form.contactId || undefined,
        dueDate: form.dueDate || undefined,
      });
      onClose();
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'Failed to create activity.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inp = 'w-full bg-muted/40 border border-border/40 rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/60 transition-colors';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Activity" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</label>
          <div className="flex flex-wrap gap-2">
            {(Object.entries(ACTIVITY_TYPES) as [ActivityType, { label: string }][]).map(([key, cfg]) => (
              <button
                key={key}
                type="button"
                onClick={() => set('type', key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  form.type === key
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-muted/30 border-border/40 text-muted-foreground hover:border-primary/40'
                }`}
              >
                {cfg.label}
              </button>
            ))}
          </div>
        </div>

        {/* Subject */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Subject *</label>
          <input className={inp} value={form.subject} onChange={e => set('subject', e.target.value)} placeholder="Follow-up call with Acme Corp" required />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</label>
          <textarea className={`${inp} resize-none`} rows={3} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Details about this activity..." />
        </div>

        {/* Contact + Due Date */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contact</label>
            <select className={inp} value={form.contactId} onChange={e => set('contactId', e.target.value)}>
              <option value="">No contact</option>
              {contacts.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Due Date</label>
            <input type="date" className={inp} value={form.dueDate} onChange={e => set('dueDate', e.target.value)} />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted/50 transition-colors">Cancel</button>
          <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
            {isSubmitting ? 'Creating...' : 'Create Activity'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Activities Page ──────────────────────────────────────────────────────────
export default function ActivitiesPage() {
  const { searchQuery, setSearchQuery, filters, setFilter } = useFilters();
  const [filterType,  setFilterType]  = useState<string>('');
  const [newOpen,     setNewOpen]     = useState(false);
  const [deleteId,    setDeleteId]    = useState<string | null>(null);
  const [isDeleting,  setIsDeleting]  = useState(false);
  const { addToast } = useUI();

  const { activities, isLoading, error, createActivity, completeActivity, deleteActivity } = useActivities({
    type: filterType || undefined,
  });

  useEffect(() => {
    if (error) addToast({ type: 'error', message: 'Failed to load activities. Please try again.' });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  const filteredActivities = useMemo(() => {
    return activities.filter((a) => {
      const lower = searchQuery.toLowerCase();
      const matchesSearch = a.subject.toLowerCase().includes(lower) ||
        (a.description && a.description.toLowerCase().includes(lower));
      const matchesCompleted = !(filters as any).showCompleted || a.completed;
      return matchesSearch && matchesCompleted;
    });
  }, [activities, searchQuery, filters]);

  const handleToggleComplete = async (id: string, current: boolean) => {
    try {
      await completeActivity(id, !current);
      addToast({ type: 'success', message: `Marked as ${!current ? 'completed' : 'incomplete'}.` });
    } catch {
      addToast({ type: 'error', message: 'Failed to update activity.' });
    }
  };

  const handleCreate = async (data: Record<string, any>) => {
    await createActivity(data);
    addToast({ type: 'success', message: 'Activity created.' });
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await deleteActivity(deleteId);
      addToast({ type: 'success', message: 'Activity deleted.' });
      setDeleteId(null);
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'Failed to delete activity.' });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <motion.div className="p-6 space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Activities</h1>
          <p className="text-muted-foreground mt-1">Track all your calls, emails, meetings, and tasks</p>
        </div>
        <button
          onClick={() => setNewOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          New Activity
        </button>
      </div>

      {/* Toolbar */}
      <Card className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px] flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
          <input
            type="text"
            placeholder="Search activities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-muted-foreground hover:text-foreground">
              <XIcon className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-3 py-2 rounded-lg bg-muted/50 outline-none text-sm">
            <option value="">All types</option>
            {Object.entries(ACTIVITY_TYPES).map(([key, cfg]) => (
              <option key={key} value={key}>{cfg.label}</option>
            ))}
          </select>
          <button
            onClick={() => setFilter('showCompleted', !(filters as any).showCompleted)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
              (filters as any).showCompleted ? 'bg-primary text-primary-foreground' : 'hover:bg-accent/10 text-foreground'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            Completed
          </button>
        </div>
      </Card>

      {/* List */}
      {error ? (
        <div className="text-center text-red-500 py-12">Failed to load activities. Make sure API is running.</div>
      ) : isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {filteredActivities.length === 0 ? (
            <Card className="text-center py-12">
              <p className="text-muted-foreground">No activities found</p>
            </Card>
          ) : (
            filteredActivities.map((activity, index) => {
              const config  = ACTIVITY_TYPES[activity.type];
              const contact = activity.contact;
              const assignee = typeof activity.assignedTo === 'object' && activity.assignedTo ? activity.assignedTo : null;
              return (
                <motion.div key={activity.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
                  <Card className={`p-4 ${activity.completed ? 'opacity-60' : ''}`}>
                    <div className="flex items-start gap-4">
                      <input
                        type="checkbox"
                        checked={activity.completed}
                        onChange={() => handleToggleComplete(activity.id, activity.completed)}
                        className="w-5 h-5 mt-1 cursor-pointer accent-primary"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h4 className={`font-medium ${activity.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                              {activity.subject}
                            </h4>
                            {activity.description && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{activity.description}</p>
                            )}
                            <div className="flex items-center gap-3 mt-2 flex-wrap">
                              <Badge variant="default" size="sm">{config.label}</Badge>
                              {contact && <span className="text-xs text-muted-foreground">{contact.firstName} {contact.lastName}</span>}
                              {assignee && <span className="text-xs text-muted-foreground">Assigned: {(assignee as any).name}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {activity.dueDate && (
                              <p className="text-xs text-muted-foreground">
                                {new Date(activity.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </p>
                            )}
                            <button
                              onClick={() => setDeleteId(activity.id)}
                              className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                              title="Delete activity"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>
      )}

      {/* New Activity Modal */}
      <NewActivityModal isOpen={newOpen} onClose={() => setNewOpen(false)} onSave={handleCreate} />

      {/* Delete Confirm Modal */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Activity" size="sm">
        <p className="text-sm text-muted-foreground mb-6">Are you sure you want to delete this activity? This cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteId(null)} className="flex-1 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted/50 transition-colors">Cancel</button>
          <button onClick={handleDelete} disabled={isDeleting} className="flex-1 px-4 py-2 rounded-lg bg-destructive text-white text-sm font-medium hover:bg-destructive/90 transition-colors disabled:opacity-50">
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </Modal>
    </motion.div>
  );
}
