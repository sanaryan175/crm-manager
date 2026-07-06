'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Users, TrendingUp, DollarSign, Target, ArrowUpRight } from 'lucide-react';
import { useDashboardMetrics } from '@/lib/hooks';
import { useRegion } from '@/lib/context';
import Card from '@/components/ui/card';
import Badge from '@/components/ui/badge';

export default function DashboardMetrics() {
  const { metrics, isLoading, error } = useDashboardMetrics();
  const { formatMoneyCompact } = useRegion();

  if (error) {
    return (
      <div className="text-center text-red-500 py-6 border border-red-500/20 bg-red-500/5 rounded-xl">
        Failed to load dashboard metrics.
      </div>
    );
  }

  if (isLoading || !metrics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="h-28 animate-pulse bg-muted/20 border-0" />
        ))}
      </div>
    );
  }

  const { trends } = metrics;
  const trendLabel = (v: number) =>
    v > 0 ? `+${v}%` : v < 0 ? `${v}%` : '0%';
  const trendVariant = (v: number): 'success' | 'error' | 'default' =>
    v > 0 ? 'success' : v < 0 ? 'error' : 'default';

  const kpis = [
    {
      label: 'Total Contacts',
      value: metrics.totalContacts.toLocaleString(),
      icon: Users,
      color: 'from-blue-500 to-cyan-500',
      trend: trendLabel(trends.contacts),
      variant: trendVariant(trends.contacts),
    },
    {
      label: 'Pipeline Value',
      value: formatMoneyCompact(metrics.pipelineValue),
      icon: DollarSign,
      color: 'from-green-500 to-emerald-500',
      trend: trendLabel(trends.pipeline),
      variant: trendVariant(trends.pipeline),
    },
    {
      label: 'Conversion Rate',
      value: `${metrics.conversionRate}%`,
      icon: Target,
      color: 'from-purple-500 to-pink-500',
      trend: trendLabel(trends.conversion),
      variant: trendVariant(trends.conversion),
    },
    {
      label: 'Closed This Month',
      value: formatMoneyCompact(metrics.closedWonThisMonth),
      icon: TrendingUp,
      color: 'from-orange-500 to-red-500',
      trend: trendLabel(trends.closed),
      variant: trendVariant(trends.closed),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi, index) => {
        const Icon = kpi.icon;
        return (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="relative overflow-hidden group">
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300 bg-gradient-to-br ${kpi.color}`} />
              <div className="flex items-start justify-between relative z-10">
                <div className="space-y-2">
                  <p className="text-xs sm:text-sm text-muted-foreground">{kpi.label}</p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground">{kpi.value}</p>
                  <Badge variant={kpi.variant} size="sm" className="mt-2">
                    <ArrowUpRight className="w-3 h-3 mr-1" />
                    {kpi.trend}
                  </Badge>
                </div>
                <div className={`p-2 sm:p-3 rounded-lg bg-gradient-to-br ${kpi.color}`}>
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
