'use client';

import React from 'react';
import { motion } from 'framer-motion';
import type { Contact } from '@/lib/types';
import Card from '@/components/ui/card';
import Badge from '@/components/ui/badge';
import { Mail, Phone, Pencil, Trash2 } from 'lucide-react';

interface ContactsListProps {
  contacts: Contact[];
  onEdit?: (contact: Contact) => void;
  onDelete?: (id: string) => void;
}

export default function ContactsList({ contacts, onEdit, onDelete }: ContactsListProps) {
  if (contacts.length === 0) {
    return (
      <Card className="text-center py-12">
        <div className="space-y-2">
          <p className="text-muted-foreground">No contacts found</p>
          <p className="text-sm text-muted-foreground">Try adjusting your search or create a new contact</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {contacts.map((contact, index) => {
        const assignedUser =
          typeof contact.assignedTo === 'object' && contact.assignedTo
            ? (contact.assignedTo as any)
            : null;

        return (
          <motion.div
            key={contact.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="flex items-start justify-between gap-4 py-4 hover:border-primary/30 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {contact.firstName.charAt(0)}{contact.lastName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground">
                      {contact.firstName} {contact.lastName}
                    </h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {contact.company || 'No company'} • {contact.jobTitle || 'No title'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-3 pl-[52px]">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Mail className="w-3 h-3" />
                    {contact.email}
                  </span>
                  {contact.phone && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Phone className="w-3 h-3" />
                      {contact.phone}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-3 pl-[52px]">
                  <Badge variant="default" size="sm">{contact.status}</Badge>
                  <Badge variant="info" size="sm">{contact.source.replace('_', ' ')}</Badge>
                  {contact.tags.slice(0, 2).map((tag) => (
                    <Badge key={tag} variant="primary" size="sm">{tag}</Badge>
                  ))}
                </div>
              </div>

              {/* Right side */}
              <div className="flex items-center gap-3 flex-shrink-0">
                {assignedUser && (
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-muted-foreground">Assigned to</p>
                    <p className="text-sm font-medium text-foreground">{assignedUser.name}</p>
                  </div>
                )}

                {onEdit && (
                  <button
                    onClick={() => onEdit(contact)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                    title="Edit contact"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(contact.id)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    title="Delete contact"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
