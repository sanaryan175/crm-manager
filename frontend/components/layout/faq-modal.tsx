'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import Modal from '@/components/ui/modal';

const FAQS = [
  { q: 'How do I add a team member?', a: 'Click the "Invite Member" button in the dashboard header, enter their email and select a role. They will receive an invitation email to join your organization.' },
  { q: 'How are deals tracked?', a: 'Deals move through stages: New → Contacted → Demo Scheduled → Proposal Sent → Negotiation → Closed Won/Lost. Drag deals between stages on the Kanban board under the Deals page.' },
  { q: 'What currencies are supported?', a: 'Your organization has a base currency set during setup. All monetary values are displayed in that currency. Only Owners and Admins can change it under Organization settings.' },
  { q: 'How do I assign activities?', a: 'When creating or editing an activity, you can assign it to any team member. Assignees receive notifications about their upcoming tasks and meetings.' },
  { q: 'Can I customize my dashboard?', a: 'The dashboard provides a summary of your key metrics, pipeline value, and recent activities. Preferences like timezone, date format, and theme can be changed in Settings.' },
  { q: 'How do I generate reports?', a: 'Visit the Reports page where you can create folders, upload files, and organize documents. Each report is stored securely within your organization.' },
];

export default function FaqModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Frequently Asked Questions" description="Quick answers to common questions about your workspace." size="lg">
      <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
        {FAQS.map((faq, i) => (
          <div key={i} className="border border-border/60 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 text-sm text-left text-foreground font-medium hover:bg-muted/30 transition-colors"
            >
              <span>{faq.q}</span>
              <ChevronDown className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform ${openIndex === i ? 'rotate-180' : ''}`} />
            </button>
            {openIndex === i && (
              <div className="px-4 pb-3 text-sm text-muted-foreground leading-relaxed border-t border-border/60 pt-3">
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </Modal>
  );
}
