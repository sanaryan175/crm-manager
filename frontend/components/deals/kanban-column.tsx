'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import type { Deal, DealStage } from '@/lib/types';
import { useRegion } from '@/lib/context';
import Card from '@/components/ui/card';
import Badge from '@/components/ui/badge';
import { X } from 'lucide-react';

interface KanbanColumnProps {
  stage: DealStage;
  stageConfig: { label: string; color: string };
  deals: Deal[];
  onCloseDeal?: (dealId: string) => void;
}

function DealCard({ deal, stage, onCloseDeal }: { deal: Deal; stage: DealStage; onCloseDeal?: (id: string) => void }) {
  const { formatMoney, formatDateTime } = useRegion();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: deal.id,
    data: { deal, stage },
  });

  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <Card className={`p-4 hover:shadow-lg hover:border-accent/50 transition-all duration-200 cursor-pointer ${isDragging ? 'opacity-40' : ''}`}>
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-medium text-foreground text-sm line-clamp-2 flex-1">{deal.title}</h4>
            {onCloseDeal && (
              <button
                onClick={(e) => { e.stopPropagation(); onCloseDeal(deal.id); }}
                title="Close deal"
                className="flex-shrink-0 p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {deal.company && <p className="text-xs text-muted-foreground">{deal.company}</p>}

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div>
              <p className="font-semibold text-sm text-primary">{formatMoney(deal.value)}</p>
            </div>
            <Badge variant={deal.priority === 'high' ? 'error' : deal.priority === 'medium' ? 'warning' : 'info'} size="sm">
              {deal.priority}
            </Badge>
          </div>

          {deal.expectedCloseDate && (
            <p className="text-xs text-muted-foreground">
              Close: {formatDateTime(deal.expectedCloseDate, { includeTime: false })}
            </p>
          )}

          {deal.contact && (
            <p className="text-xs text-muted-foreground">
              {deal.contact.firstName} {deal.contact.lastName}
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}

export default function KanbanColumn({ stage, stageConfig, deals, onCloseDeal }: KanbanColumnProps) {
  const { formatMoneyCompact } = useRegion();
  const { setNodeRef, isOver } = useDroppable({ id: stage });

  const totalValue = deals.reduce((acc, deal) => acc + deal.value, 0);

  const formatTotalValue = () => {
    if (deals.length === 0) return 'No deals';
    return formatMoneyCompact(totalValue);
  };

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-foreground">{stageConfig.label}</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {deals.length} deal{deals.length !== 1 ? 's' : ''} &bull; {formatTotalValue()}
            </p>
          </div>
          <Badge variant="default" size="sm">{deals.length}</Badge>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={`space-y-2 min-h-[120px] rounded-lg transition-colors ${isOver ? 'bg-accent/10 ring-2 ring-accent/30' : ''}`}
      >
        {deals.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No deals</p>
          </div>
        ) : (
          deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} stage={stage} onCloseDeal={onCloseDeal} />
          ))
        )}
      </div>
    </div>
  );
}
