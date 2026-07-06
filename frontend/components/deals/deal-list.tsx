'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useDeals } from '@/lib/hooks';
import { useRegion } from '@/lib/context';
import { DEAL_STAGES, type Deal } from '@/lib/types';
import Badge from '@/components/ui/badge';
import Card from '@/components/ui/card';
import { X } from 'lucide-react';

interface DealListProps {
  onCloseDeal?: (dealId: string) => void;
  onDealClick?: (deal: Deal) => void;
}

export default function DealList({ onCloseDeal, onDealClick }: DealListProps) {
  const { deals, isLoading, error } = useDeals();
  const { formatMoney, formatDateTime } = useRegion();

  if (error) {
    return <div className="text-center text-red-500 py-12">Failed to load deals.</div>;
  }
  if (isLoading) {
    return <div className="flex justify-center items-center py-12"><div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;
  }
  if (deals.length === 0) {
    return (
      <Card className="text-center py-12">
        <p className="text-muted-foreground">No deals found</p>
        <p className="text-sm text-muted-foreground mt-1">Create your first deal to get started</p>
      </Card>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/30 border-b border-border">
            <th className="text-left px-4 py-3 font-semibold text-foreground">Title</th>
            <th className="text-left px-4 py-3 font-semibold text-foreground">Company</th>
            <th className="text-left px-4 py-3 font-semibold text-foreground">Stage</th>
            <th className="text-right px-4 py-3 font-semibold text-foreground">Value</th>
            <th className="text-left px-4 py-3 font-semibold text-foreground">Priority</th>
            <th className="text-left px-4 py-3 font-semibold text-foreground">Contact</th>
            <th className="text-left px-4 py-3 font-semibold text-foreground">Close Date</th>
            <th className="w-10 px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {deals.map((deal, i) => {
            const stageCfg = DEAL_STAGES[deal.stage];
            return (
              <motion.tr
                key={deal.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.02 }}
                onClick={() => onDealClick?.(deal)}
                className={`border-b border-border/50 last:border-0 hover:bg-accent/5 transition-colors cursor-pointer ${
                  deal.stage === 'closed_won' ? 'bg-green-500/5' : deal.stage === 'closed_lost' ? 'bg-red-500/5' : ''
                }`}
              >
                <td className="px-4 py-3 font-medium text-foreground">{deal.title}</td>
                <td className="px-4 py-3 text-muted-foreground">{deal.company || '—'}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: stageCfg?.color || '#888' }} />
                    {stageCfg?.label || deal.stage}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-semibold text-foreground">{formatMoney(deal.value)}</td>
                <td className="px-4 py-3">
                  <Badge
                    variant={deal.priority === 'high' ? 'error' : deal.priority === 'medium' ? 'warning' : 'info'}
                    size="sm"
                  >
                    {deal.priority}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {deal.contact ? `${deal.contact.firstName} ${deal.contact.lastName}` : '—'}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {deal.expectedCloseDate
                    ? formatDateTime(deal.expectedCloseDate, { includeTime: false })
                    : '—'}
                </td>
                <td className="px-4 py-3">
                  {onCloseDeal && (deal.stage !== 'closed_won' && deal.stage !== 'closed_lost') && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onCloseDeal(deal.id); }}
                      title="Close deal"
                      className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
