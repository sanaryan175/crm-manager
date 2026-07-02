'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useDashboardMetrics } from '@/lib/hooks';
import { useRegion } from '@/lib/context';
import Card from '@/components/ui/card';

export default function QuickStats() {
  const { metrics, isLoading, error } = useDashboardMetrics();
  const { formatMoneyCompact } = useRegion();

  if (error || isLoading || !metrics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="h-16 animate-pulse bg-muted/10 border-0" />
        ))}
      </div>
    );
  }

  const stats = [
    {
      label: 'Overdue Tasks',
      value: metrics.overdueTasks,
      icon: AlertCircle,
      color: 'bg-destructive/10 text-destructive',
      bgColor: 'from-destructive/20 to-destructive/5',
    },
    {
      label: 'This Week Activities',
      value: metrics.thisWeekActivities,
      icon: CheckCircle,
      color: 'bg-green-500/10 text-green-600',
      bgColor: 'from-green-500/20 to-green-500/5',
    },
    {
      label: 'Avg Deal Size',
      value: formatMoneyCompact(metrics.averageDealSize),
      icon: Clock,
      color: 'bg-blue-500/10 text-blue-600',
      bgColor: 'from-blue-500/20 to-blue-500/5',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`bg-gradient-to-br ${stat.bgColor} border-0`}>
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}

