'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, List, LayoutGridIcon } from 'lucide-react';
import KanbanBoard from '@/components/deals/kanban-board';
import Card from '@/components/ui/card';

export default function DealsPage() {
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  return (
    <motion.div
      className="p-6 space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pipeline</h1>
          <p className="text-muted-foreground mt-1">
            Manage your sales deals and track progress
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium">
          <Plus className="w-4 h-4" />
          New Deal
        </button>
      </div>

      {/* View toggle */}
      <Card className="flex items-center gap-2">
        <button
          onClick={() => setViewMode('kanban')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
            viewMode === 'kanban'
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-accent/10 text-foreground'
          }`}
        >
          <LayoutGridIcon className="w-4 h-4" />
          Kanban
        </button>
        <button
          onClick={() => setViewMode('list')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
            viewMode === 'list'
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-accent/10 text-foreground'
          }`}
        >
          <List className="w-4 h-4" />
          List
        </button>
      </Card>

      {/* Kanban Board */}
      {viewMode === 'kanban' && <KanbanBoard />}
    </motion.div>
  );
}
