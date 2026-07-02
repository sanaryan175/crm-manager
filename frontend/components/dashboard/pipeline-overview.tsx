'use client';

import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useDeals } from '@/lib/hooks';
import { useRegion } from '@/lib/context';
import { DEAL_STAGES } from '@/lib/types';
import Card, { CardHeader } from '@/components/ui/card';

export default function PipelineOverview() {
  const { deals, isLoading, error } = useDeals();
  const { formatMoney, formatMoneyCompact } = useRegion();

  const chartData = useMemo(() => {
    const grouped: Record<string, number> = {};
    const counts: Record<string, number> = {};
    deals.forEach((deal) => {
      grouped[deal.stage] = (grouped[deal.stage] || 0) + deal.value;
      counts[deal.stage] = (counts[deal.stage] || 0) + 1;
    });
    return Object.entries(DEAL_STAGES)
      .filter(([stage]) => stage !== 'closed_lost')
      .map(([stage, config]) => ({
        name: config.label,
        value: grouped[stage] || 0,
        count: counts[stage] || 0,
      }));
  }, [deals]);

  if (error) {
    return <Card className="flex items-center justify-center h-96 text-red-500 text-sm">Failed to load pipeline data.</Card>;
  }
  if (isLoading) {
    return <Card className="flex items-center justify-center h-96"><div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" /></Card>;
  }

  return (
    <Card>
      <CardHeader title="Sales Pipeline" description="Deal value by stage (excluding lost deals)" />
      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" style={{ fontSize: '12px' }} />
            <YAxis stroke="rgba(255,255,255,0.5)" style={{ fontSize: '12px' }}
              tickFormatter={(v) => formatMoneyCompact(v)} />
            <Tooltip
              contentStyle={{ backgroundColor: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
              formatter={(value: number) => [formatMoney(value), 'Value']}
            />
            <Bar dataKey="value" fill="url(#gradient)" radius={[8, 8, 0, 0]} animationDuration={800} />
            <defs>
              <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(96,165,250)" />
                <stop offset="100%" stopColor="rgb(139,92,246)" />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-border">
        {chartData.map((item) => (
          <div key={item.name}>
            <p className="text-xs text-muted-foreground">{item.name}</p>
            <p className="text-sm font-semibold text-foreground">
              {formatMoneyCompact(item.value)} ({item.count} deals)
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}

