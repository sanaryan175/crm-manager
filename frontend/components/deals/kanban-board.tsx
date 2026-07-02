'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useDeals } from '@/lib/hooks';
import { DEAL_STAGES, type DealStage } from '@/lib/types';
import KanbanColumn from './kanban-column';
import Card from '@/components/ui/card';

export default function KanbanBoard() {
  const { deals, isLoading, error } = useDeals();
  const stages: DealStage[] = Object.keys(DEAL_STAGES) as DealStage[];

  // Group deals by stage dynamically
  const dealsByStage = useMemo(() => {
    const grouped: Record<string, typeof deals> = {};
    deals.forEach((deal) => {
      if (!grouped[deal.stage]) {
        grouped[deal.stage] = [];
      }
      grouped[deal.stage].push(deal);
    });
    return grouped;
  }, [deals]);

  // Filter out closed_lost from the main board
  const boardStages = stages.filter((stage) => stage !== 'closed_lost');

  if (error) {
    return (
      <div className="text-center text-red-500 py-12">
        Failed to load deals pipeline. Make sure API is running.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-6 animate-fade-in">
      <div className="flex gap-6 min-w-max">
        {boardStages.map((stage) => {
          const stageDeals = dealsByStage[stage] || [];
          const stageConfig = DEAL_STAGES[stage];

          return (
            <motion.div
              key={stage}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex-shrink-0 w-80"
            >
              <KanbanColumn
                stage={stage}
                stageConfig={stageConfig}
                deals={stageDeals}
              />
            </motion.div>
          );
        })}

        {/* Closed deals column */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex-shrink-0 w-80"
        >
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-green-500/20 to-green-500/5 border border-green-500/20 rounded-lg p-4">
              <h3 className="font-semibold text-green-600">Closed Won</h3>
              <p className="text-xs text-green-600/70">
                ${(dealsByStage.closed_won || []).reduce((sum, d) => sum + d.value, 0) / 1000}K
              </p>
            </div>
            <div className="space-y-2 text-wrap">
              {(dealsByStage.closed_won || []).map((deal) => (
                <Card
                  key={deal.id}
                  className="text-sm p-3 border-l-4 border-l-green-500"
                >
                  <p className="font-medium text-foreground">{deal.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">${deal.value / 1000}K</p>
                </Card>
              ))}
            </div>

            <div className="bg-gradient-to-br from-red-500/20 to-red-500/5 border border-red-500/20 rounded-lg p-4 mt-6">
              <h3 className="font-semibold text-red-600">Closed Lost</h3>
              <p className="text-xs text-red-600/70">
                {(dealsByStage.closed_lost || []).length} deals
              </p>
            </div>
            <div className="space-y-2">
              {(dealsByStage.closed_lost || []).map((deal) => (
                <Card
                  key={deal.id}
                  className="text-sm p-3 border-l-4 border-l-red-500"
                >
                  <p className="font-medium text-foreground">{deal.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">${deal.value / 1000}K</p>
                </Card>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

