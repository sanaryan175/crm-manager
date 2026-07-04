'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Users, TrendingUp, DollarSign, Target, ArrowUpRight } from 'lucide-react';
import { useDashboardMetrics, useDeals } from '@/lib/hooks';
import { useRegion } from '@/lib/context';
import Card from '@/components/ui/card';
import Badge from '@/components/ui/badge';

export default function DashboardMetrics() {
  const { metrics, isLoading, error } = useDashboardMetrics();
  const { deals } = useDeals();
  const { formatMoneyCompact } = useRegion();

  // Calculate currency breakdown for pipeline value
  const pipelineCurrencyBreakdown = useMemo(() => {
    const breakdown: Record<string, number> = {};
    deals.forEach((deal: any) => {
      if (deal.stage !== 'closed_lost') {
        breakdown[deal.currency] = (breakdown[deal.currency] || 0) + deal.value;
      }
    });
    return breakdown;
  }, [deals]);

  // Calculate currency breakdown for closed won this month
  const closedWonCurrencyBreakdown = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const breakdown: Record<string, number> = {};
    deals.forEach((deal: any) => {
      if (deal.stage === 'closed_won' && new Date(deal.closedAt || '') >= startOfMonth) {
        breakdown[deal.currency] = (breakdown[deal.currency] || 0) + deal.value;
      }
    });
    return breakdown;
  }, [deals]);

  const formatMultiCurrency = (breakdown: Record<string, number>) => {
    const currencies = Object.keys(breakdown);
    if (currencies.length === 0) return '$0';
    if (currencies.length === 1) return formatMoneyCompact(breakdown[currencies[0]], currencies[0]);
    return currencies.map(c => formatMoneyCompact(breakdown[c], c)).join(' + ');
  };

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

  const kpis = [
    {
      label: 'Total Contacts',
      value: metrics.totalContacts.toLocaleString(),
      icon: Users,
      color: 'from-blue-500 to-cyan-500',
      trend: '+12%',
    },
    {
      label: 'Pipeline Value',
      value: formatMultiCurrency(pipelineCurrencyBreakdown),
      icon: DollarSign,
      color: 'from-green-500 to-emerald-500',
      trend: '+28%',
    },
    {
      label: 'Conversion Rate',
      value: `${metrics.conversionRate}%`,
      icon: Target,
      color: 'from-purple-500 to-pink-500',
      trend: '+5%',
    },
    {
      label: 'Closed This Month',
      value: formatMultiCurrency(closedWonCurrencyBreakdown),
      icon: TrendingUp,
      color: 'from-orange-500 to-red-500',
      trend: '+15%',
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
                  <Badge variant="success" size="sm" className="mt-2">
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
