'use client';

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { DndContext, DragOverlay, pointerWithin } from '@dnd-kit/core';
import { useDeals } from '@/lib/hooks';
import { DEAL_STAGES, type DealStage, type Deal } from '@/lib/types';
import { useRegion } from '@/lib/context';
import KanbanColumn from './kanban-column';
import Card from '@/components/ui/card';

interface KanbanBoardProps {
  onCloseDeal?: (dealId: string) => void;
  onDealClick?: (deal: Deal) => void;
}

export default function KanbanBoard({ onCloseDeal, onDealClick }: KanbanBoardProps) {
  const { deals, isLoading, error, updateDealStage } = useDeals();
  const { formatMoney } = useRegion();
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);

  const dealsByStage = useMemo(() => {
    const grouped: Record<string, typeof deals> = {};
    deals.forEach((deal) => {
      if (!grouped[deal.stage]) grouped[deal.stage] = [];
      grouped[deal.stage].push(deal);
    });
    return grouped;
  }, [deals]);

  // All stages except closed ones go on the main board
  const boardStages = (Object.keys(DEAL_STAGES) as DealStage[]).filter(
    (s) => s !== 'closed_won' && s !== 'closed_lost'
  );

  function handleDragStart(event: any) {
    setActiveDeal(event.active.data.current?.deal ?? null);
  }

  function handleDragEnd(event: any) {
    const { active, over } = event;
    const currentStage = active.data.current?.stage as string | undefined;
    const deal = active.data.current?.deal as Deal | undefined;
    setActiveDeal(null);

    if (over) {
      const newStage = over.id as string;
      if (currentStage && currentStage !== newStage) {
        updateDealStage(active.id as string, newStage);
      } else if (deal) {
        onDealClick?.(deal);
      }
    } else if (deal) {
      onDealClick?.(deal);
    }
  }

  function handleDragCancel() {
    setActiveDeal(null);
  }

  if (error) {
    return <div className="text-center text-red-500 py-12">Failed to load deals pipeline. Make sure API is running.</div>;
  }
  if (isLoading) {
    return <div className="flex justify-center items-center py-12"><div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel} collisionDetection={pointerWithin}>
      <div className="overflow-x-auto pb-6">
        <div className="flex gap-4 sm:gap-6 min-w-max">
          {/* Active pipeline stages */}
          {boardStages.map((stage) => (
            <motion.div
              key={stage}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="flex-shrink-0 w-64 sm:w-72"
            >
              <KanbanColumn
                stage={stage}
                stageConfig={DEAL_STAGES[stage]}
                deals={dealsByStage[stage] || []}
                onCloseDeal={onCloseDeal}
              />
            </motion.div>
          ))}

          {/* Closed Won column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="flex-shrink-0 w-64 sm:w-72 space-y-3"
          >
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <h3 className="font-semibold text-green-600">Closed Won 🏆</h3>
              <p className="text-xs text-green-600/70">
                {(dealsByStage.closed_won || []).length} deal{(dealsByStage.closed_won || []).length !== 1 ? 's' : ''}
              </p>
            </div>
            {(dealsByStage.closed_won || []).map((deal) => (
              <Card key={deal.id} className="text-sm p-3 border-l-4 border-l-green-500 cursor-pointer hover:bg-accent/5 transition-colors" onClick={() => onDealClick?.(deal)}>
                <p className="font-medium text-foreground">{deal.title}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatMoney(deal.value)}
                </p>
              </Card>
            ))}

            {/* Closed Lost column */}
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mt-4">
              <h3 className="font-semibold text-red-600">Closed Lost</h3>
              <p className="text-xs text-red-600/70">
                {(dealsByStage.closed_lost || []).length} deal{(dealsByStage.closed_lost || []).length !== 1 ? 's' : ''}
              </p>
            </div>
            {(dealsByStage.closed_lost || []).map((deal) => (
              <Card key={deal.id} className="text-sm p-3 border-l-4 border-l-red-500 cursor-pointer hover:bg-accent/5 transition-colors" onClick={() => onDealClick?.(deal)}>
                <p className="font-medium text-foreground">{deal.title}</p>
                <p className="text-xs text-muted-foreground mt-1 capitalize">{(deal.closeReason || 'lost').replace('_', ' ')}</p>
              </Card>
            ))}
          </motion.div>
        </div>
      </div>

      <DragOverlay>
        {activeDeal && (
          <Card className="p-4 shadow-xl opacity-95 w-64 sm:w-72 border-2 border-primary/40">
            <div className="space-y-2">
              <h4 className="font-medium text-foreground text-sm">{activeDeal.title}</h4>
              {activeDeal.company && <p className="text-xs text-muted-foreground">{activeDeal.company}</p>}
              <p className="font-semibold text-sm text-primary">{formatMoney(activeDeal.value)}</p>
            </div>
          </Card>
        )}
      </DragOverlay>
    </DndContext>
  );
}
