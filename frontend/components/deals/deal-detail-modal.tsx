'use client';

import React, { useState } from 'react';
import Modal from '@/components/ui/modal';
import Badge from '@/components/ui/badge';
import { useRegion } from '@/lib/context';
import { DEAL_STAGES, type Deal, type DealCloseReason } from '@/lib/types';

interface DealDetailModalProps {
  deal: Deal | null;
  isOpen: boolean;
  onClose: () => void;
  onCloseDeal?: (dealId: string, stage: 'closed_won' | 'closed_lost', reason: DealCloseReason) => Promise<void>;
}

const REASONS_LOST: DealCloseReason[] = ['lost', 'no_decision', 'cancelled'];

export default function DealDetailModal({ deal, isOpen, onClose, onCloseDeal }: DealDetailModalProps) {
  const { formatMoney, formatDateTime } = useRegion();
  const [closing, setClosing] = useState<'won' | 'lost' | null>(null);
  const [closeReason, setCloseReason] = useState<DealCloseReason>('won');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!deal) return null;

  const stageCfg = DEAL_STAGES[deal.stage];

  const isClosed = deal.stage === 'closed_won' || deal.stage === 'closed_lost';

  async function handleConfirmClose() {
    if (!onCloseDeal || !deal) return;
    setIsSubmitting(true);
    try {
      const stage = closing === 'won' ? 'closed_won' as const : 'closed_lost' as const;
      await onCloseDeal(deal.id, stage, closeReason);
      setClosing(null);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleCloseClick(outcome: 'won' | 'lost') {
    setClosing(outcome);
    setCloseReason(outcome === 'won' ? 'won' : 'lost');
  }

  return (
    <Modal isOpen={isOpen} onClose={() => { setClosing(null); onClose(); }} title={deal?.title ?? 'Deal Details'} size="lg">
      <div className="space-y-5">
        {/* Stage & Priority badges */}
        <div className="flex items-center gap-3">
          {stageCfg && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
              style={{ backgroundColor: `${stageCfg.color}15`, color: stageCfg.color }}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: stageCfg.color }} />
              {stageCfg.label}
            </span>
          )}
          <Badge
            variant={deal.priority === 'high' ? 'error' : deal.priority === 'medium' ? 'warning' : 'info'}
            size="sm"
          >
            {deal.priority}
          </Badge>
        </div>

        {/* Value */}
        <div className="bg-muted/20 rounded-lg px-4 py-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Deal Value</p>
          <p className="text-2xl font-bold text-foreground mt-1">{formatMoney(deal.value)}</p>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Company</p>
            <p className="text-sm text-foreground">{deal.company || '—'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Contact</p>
            <p className="text-sm text-foreground">
              {deal.contact ? `${deal.contact.firstName} ${deal.contact.lastName}` : '—'}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Expected Close</p>
            <p className="text-sm text-foreground">
              {deal.expectedCloseDate
                ? formatDateTime(deal.expectedCloseDate, { includeTime: false })
                : '—'}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Assigned To</p>
            <p className="text-sm text-foreground">
              {typeof deal.assignedTo === 'object' && deal.assignedTo
                ? (deal.assignedTo as any).name
                : '—'}
            </p>
          </div>
        </div>

        {/* Status / Close info */}
        {deal.stage === 'closed_won' && (
          <div className="bg-green-500/10 rounded-lg px-4 py-3">
            <p className="text-sm font-semibold text-green-600">Won</p>
            {deal.closedAt && (
              <p className="text-xs text-green-600/70 mt-1">
                Closed {formatDateTime(deal.closedAt, { includeTime: false })}
              </p>
            )}
          </div>
        )}
        {deal.stage === 'closed_lost' && (
          <div className="bg-red-500/10 rounded-lg px-4 py-3">
            <p className="text-sm font-semibold text-red-600">
              Lost {(deal.closeReason && deal.closeReason !== 'lost') ? `— ${deal.closeReason.replace('_', ' ')}` : ''}
            </p>
            {deal.closedAt && (
              <p className="text-xs text-red-600/70 mt-1">
                Closed {formatDateTime(deal.closedAt, { includeTime: false })}
              </p>
            )}
          </div>
        )}

        {/* Close Deal buttons for active deals */}
        {!isClosed && onCloseDeal && !closing && (
          <div className="space-y-3 pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Close Deal</p>
            <div className="flex gap-3">
              <button onClick={() => handleCloseClick('won')} className="flex-1 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors">
                🏆 Won
              </button>
              <button onClick={() => handleCloseClick('lost')} className="flex-1 py-2 rounded-lg bg-destructive text-white text-sm font-medium hover:bg-destructive/90 transition-colors">
                ❌ Lost
              </button>
            </div>
          </div>
        )}

        {!isClosed && closing && (
          <div className="space-y-3 pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              {closing === 'won' ? 'Mark as Won' : 'Mark as Lost'}
            </p>
            {closing === 'lost' && (
              <select
                value={closeReason}
                onChange={(e) => setCloseReason(e.target.value as DealCloseReason)}
                className="w-full bg-muted/40 border border-border/40 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary/60"
              >
                {REASONS_LOST.map((r) => (
                  <option key={r} value={r}>{r.replace('_', ' ')}</option>
                ))}
              </select>
            )}
            <div className="flex gap-3">
              <button onClick={() => setClosing(null)} className="flex-1 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted/50 transition-colors">
                Cancel
              </button>
              <button onClick={handleConfirmClose} disabled={isSubmitting}
                className={`flex-1 py-2 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-50 ${closing === 'won' ? 'bg-green-600 hover:bg-green-700' : 'bg-destructive hover:bg-destructive/90'}`}>
                {isSubmitting ? 'Closing...' : `Confirm ${closing === 'won' ? 'Won' : 'Lost'}`}
              </button>
            </div>
          </div>
        )}

        {/* Notes */}
        {deal.notes && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Notes</p>
            <p className="text-sm text-foreground bg-muted/20 rounded-lg px-4 py-3 whitespace-pre-wrap">{deal.notes}</p>
          </div>
        )}

        {/* Timestamps */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Created</p>
            <p className="text-xs text-foreground">
              {formatDateTime(deal.createdAt)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Updated</p>
            <p className="text-xs text-foreground">
              {formatDateTime(deal.updatedAt)}
            </p>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted/50 transition-colors">
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
