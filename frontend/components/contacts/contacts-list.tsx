'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import type { Contact } from '@/lib/types';
import { mockUsers } from '@/lib/mockData';
import Card from '@/components/ui/card';
import Badge from '@/components/ui/badge';
import { ChevronRight, Mail, Phone } from 'lucide-react';

interface ContactsListProps {
  contacts: Contact[];
}

export default function ContactsList({ contacts }: ContactsListProps) {
  if (contacts.length === 0) {
    return (
      <Card className="text-center py-12">
        <div className="space-y-2">
          <p className="text-muted-foreground">No contacts found</p>
          <p className="text-sm text-muted-foreground">
            Try adjusting your search or create a new contact
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {contacts.map((contact, index) => {
        const assignedUser = typeof contact.assignedTo === 'object' && contact.assignedTo
          ? (contact.assignedTo as any)
          : contact.assignedTo
            ? mockUsers.find((u) => u.id === contact.assignedTo)
            : null;

        return (
          <motion.div
            key={contact.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Link href={`/contacts/${contact.id}`}>
              <Card hoverable className="flex items-start justify-between gap-4 py-4">
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

                  {/* Contact info */}
                  <div className="flex items-center gap-4 mt-3 ml-13">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                      <Mail className="w-3 h-3" />
                      {contact.email}
                    </div>
                    {contact.phone && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                        <Phone className="w-3 h-3" />
                        {contact.phone}
                      </div>
                    )}
                  </div>

                  {/* Tags and status */}
                  <div className="flex items-center gap-2 mt-3">
                    <Badge variant="default" size="sm">
                      {contact.status}
                    </Badge>
                    {contact.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="info" size="sm">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Right side info */}
                <div className="flex items-center gap-4 flex-shrink-0">
                  {assignedUser && (
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Assigned to</p>
                      <p className="text-sm font-medium text-foreground">
                        {assignedUser.name}
                      </p>
                    </div>
                  )}
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </Card>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}
