'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, Download, X, User, Mail, Phone, Building, Briefcase, ChevronDown } from 'lucide-react';
import Badge from '@/components/ui/badge';
import { useContacts, useTeamMembers, triggerRefresh } from '@/lib/hooks';
import { apiFetch } from '@/lib/api';
import * as XLSX from 'xlsx';
import ContactsList from '@/components/contacts/contacts-list';
import Card from '@/components/ui/card';
import Modal from '@/components/ui/modal';
import { useFilters, useUI, useAuth } from '@/lib/context';
import type { Contact, ContactSource } from '@/lib/types';

const SOURCES: ContactSource[] = ['website', 'referral', 'cold_outreach', 'event', 'partner', 'other'];
const SOURCE_LABELS: Record<ContactSource, string> = {
  website: 'Website', referral: 'Referral', cold_outreach: 'Cold Outreach',
  event: 'Event', partner: 'Partner', other: 'Other',
};

// ─── New / Edit Contact Modal ─────────────────────────────────────────────────
function ContactModal({
  isOpen,
  onClose,
  contact,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  contact?: Contact | null;
  onSave: (data: Partial<Contact>) => Promise<void>;
}) {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '',
    phone: '', company: '', jobTitle: '',
    source: 'website' as ContactSource, notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useUI();

  // Populate form when editing
  useEffect(() => {
    if (contact) {
      setForm({
        firstName: contact.firstName,
        lastName:  contact.lastName,
        email:     contact.email,
        phone:     contact.phone ?? '',
        company:   contact.company ?? '',
        jobTitle:  contact.jobTitle ?? '',
        source:    contact.source,
        notes:     contact.notes ?? '',
      });
    } else {
      setForm({ firstName: '', lastName: '', email: '', phone: '', company: '', jobTitle: '', source: 'website', notes: '' });
    }
  }, [contact, isOpen]);

  const set = (k: keyof typeof form, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.email.trim()) {
      addToast({ type: 'error', message: 'First name and email are required.' });
      return;
    }
    setIsSubmitting(true);
    try {
      await onSave({
        ...form,
        phone:    form.phone    || undefined,
        company:  form.company  || undefined,
        jobTitle: form.jobTitle || undefined,
        notes:    form.notes    || undefined,
      });
      onClose();
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'Failed to save contact.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inp = 'w-full bg-muted/40 border border-border/40 rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/60 transition-colors';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={contact ? 'Edit Contact' : 'New Contact'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">First Name *</label>
            <input className={inp} value={form.firstName} onChange={e => set('firstName', e.target.value)} placeholder="Sarah" required />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Last Name</label>
            <input className={inp} value={form.lastName} onChange={e => set('lastName', e.target.value)} placeholder="Chen" />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email *</label>
          <input type="email" className={inp} value={form.email} onChange={e => set('email', e.target.value)} placeholder="sarah@company.com" required />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Phone</label>
            <input className={inp} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+1 555 000 0000" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Company</label>
            <input className={inp} value={form.company} onChange={e => set('company', e.target.value)} placeholder="Acme Corp" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Job Title</label>
            <input className={inp} value={form.jobTitle} onChange={e => set('jobTitle', e.target.value)} placeholder="Sales Director" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Source</label>
            <select className={inp} value={form.source} onChange={e => set('source', e.target.value)}>
              {SOURCES.map(s => <option key={s} value={s}>{SOURCE_LABELS[s]}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notes</label>
          <textarea className={`${inp} resize-none`} rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any notes..." />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted/50 transition-colors">Cancel</button>
          <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
            {isSubmitting ? 'Saving...' : (contact ? 'Save Changes' : 'Create Contact')}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Contact Detail Modal ──────────────────────────────────────────────────────
function ContactDetailModal({
  contact,
  isOpen,
  onClose,
}: {
  contact: Contact | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!contact) return null;
  const assignedUser = typeof contact.assignedTo === 'object' && contact.assignedTo ? contact.assignedTo as any : null;

  const rows = [
    { icon: User, label: 'Name', value: `${contact.firstName} ${contact.lastName}` },
    { icon: Mail, label: 'Email', value: contact.email },
    { icon: Phone, label: 'Phone', value: contact.phone || '—' },
    { icon: Building, label: 'Company', value: contact.company || '—' },
    { icon: Briefcase, label: 'Job Title', value: contact.jobTitle || '—' },
    { icon: User, label: 'Assigned To', value: assignedUser?.name || '' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Contact Details" size="md">
      <div className="space-y-4">
        {rows.map((r) => {
          const Icon = r.icon;
          const isAssigneeRow = r.label === 'Assigned To';
          return (
            <div key={r.label} className="flex items-start gap-3">
              <Icon className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{r.label}</p>
                {isAssigneeRow && !r.value ? (
                  <p className="text-sm text-muted-foreground italic">Unassigned</p>
                ) : (
                  <p className="text-sm font-medium text-foreground">{r.value}</p>
                )}
              </div>
            </div>
          );
        })}
        <div className="flex items-start gap-3">
          <Filter className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Source</p>
            <p className="text-sm font-medium text-foreground capitalize">{contact.source.replace('_', ' ')}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <User className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Status</p>
            <Badge variant="default" size="sm" className="mt-1">{contact.status}</Badge>
          </div>
        </div>
        {contact.notes && (
          <div className="flex items-start gap-3">
            <X className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Notes</p>
              <p className="text-sm text-foreground mt-1 whitespace-pre-wrap">{contact.notes}</p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ─── Contacts Page ────────────────────────────────────────────────────────────
export default function ContactsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { filters, setFilter } = useFilters();
  const { addToast } = useUI();
  const { user } = useAuth();
  const { members } = useTeamMembers();
  const { contacts, isLoading, error, createContact, updateContact, deleteContact } = useContacts({
    status: filters.status,
    source: filters.source,
  });

  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts;
    const q = searchQuery.toLowerCase();
    return contacts.filter((c) =>
      c.firstName.toLowerCase().includes(q) ||
      c.lastName.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.company || '').toLowerCase().includes(q) ||
      (c.jobTitle || '').toLowerCase().includes(q) ||
      (c.phone || '').includes(q)
    );
  }, [contacts, searchQuery]);

  const [modalOpen,    setModalOpen]    = useState(false);
  const [editContact,  setEditContact]  = useState<Contact | null>(null);
  const [detailContact, setDetailContact] = useState<Contact | null>(null);
  const [filterOpen,   setFilterOpen]   = useState(false);
  const [assignContactId, setAssignContactId] = useState<string | null>(null);
  const [deleteId,     setDeleteId]     = useState<string | null>(null);
  const [isDeleting,   setIsDeleting]   = useState(false);

  const canAssign = user && (user.isOwner || user.role?.name === 'admin' || user.role?.name === 'sales_manager');

  const handleExport = () => {
    const data = filteredContacts.map((c) => ({
      'First Name': c.firstName,
      'Last Name': c.lastName,
      Email: c.email,
      Phone: c.phone || '',
      Company: c.company || '',
      'Job Title': c.jobTitle || '',
      Source: c.source.replace('_', ' '),
      Status: c.status,
      Tags: c.tags.join(', '),
      Notes: c.notes || '',
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Contacts');
    XLSX.writeFile(wb, 'contacts.xlsx');
  };

  useEffect(() => {
    if (error) addToast({ type: 'error', message: 'Failed to load contacts. Please try again.' });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  const handleCreate = async (data: Partial<Contact>) => {
    await createContact(data);
    addToast({ type: 'success', message: 'Contact created successfully.' });
  };

  const handleUpdate = async (data: Partial<Contact>) => {
    if (!editContact) return;
    await updateContact(editContact.id, data);
    addToast({ type: 'success', message: 'Contact updated successfully.' });
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await deleteContact(deleteId);
      addToast({ type: 'success', message: 'Contact deleted.' });
      setDeleteId(null);
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'Failed to delete contact.' });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <motion.div className="p-6 space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Contacts</h1>
          <p className="text-muted-foreground mt-1">Manage and track all your customer contacts</p>
        </div>
        <button
          onClick={() => { setEditContact(null); setModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          New Contact
        </button>
      </div>

      {/* Toolbar */}
      <Card className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px] flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
          <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 relative">
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent/10 transition-colors text-sm font-medium"
          >
            <Filter className="w-4 h-4" /> Filter <ChevronDown className="w-3 h-3" />
          </button>
          {filterOpen && (
            <div className="absolute top-full right-0 mt-2 w-56 bg-background border border-border rounded-xl shadow-xl z-50 p-3 space-y-3">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Source</p>
                <div className="flex flex-wrap gap-1">
                  {SOURCES.map((s) => (
                    <button
                      key={s}
                      onClick={() => setFilter('source', filters.source === s ? undefined : s)}
                      className={`text-xs px-2 py-1 rounded-md transition-colors ${
                        filters.source === s
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted/40 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {SOURCE_LABELS[s]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Status</p>
                <div className="flex flex-wrap gap-1">
                  {['active', 'inactive', 'lead'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setFilter('status', filters.status === st ? undefined : st)}
                      className={`text-xs px-2 py-1 rounded-md capitalize transition-colors ${
                        filters.status === st
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted/40 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
              {(filters.source || filters.status) && (
                <button
                  onClick={() => { setFilter('source', undefined); setFilter('status', undefined); }}
                  className="text-xs text-primary hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
          <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent/10 transition-colors text-sm font-medium">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </Card>

      {/* List */}
      {error ? (
        <div className="text-center text-red-500 py-12">Failed to load contacts. Please verify backend is running.</div>
      ) : isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <ContactsList
          contacts={filteredContacts}
          user={user}
          members={members}
          canAssign={!!canAssign}
          assignContactId={assignContactId}
          onAssign={(id) => setAssignContactId(assignContactId === id ? null : id)}
          onDetail={(c) => setDetailContact(c)}
          onEdit={(c) => { setEditContact(c); setModalOpen(true); }}
          onDelete={(id) => setDeleteId(id)}
        />
      )}

      {/* Create / Edit Modal */}
      <ContactModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditContact(null); }}
        contact={editContact}
        onSave={editContact ? handleUpdate : handleCreate}
      />

      {/* Detail Modal */}
      <ContactDetailModal contact={detailContact} isOpen={!!detailContact} onClose={() => setDetailContact(null)} />

      {/* Delete Confirm Modal */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Contact" size="sm">
        <p className="text-sm text-muted-foreground mb-6">Are you sure you want to delete this contact? This action cannot be undone.</p>
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
