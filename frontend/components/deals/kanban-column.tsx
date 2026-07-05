'use client';

import React from 'react';
import type { Deal, DealStage } from '@/lib/types';
import { useRegion } from '@/lib/context';
import { useAuth } from '@/lib/context';
import { convertCurrency } from '@/lib/currency';
import Card from '@/components/ui/card';
import Badge from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

interface KanbanColumnProps {
  stage: DealStage;
  stageConfig: { label: string; color: string };
  deals: Deal[];
  onCloseDeal?: (dealId: string) => void;
}

export default function KanbanColumn({ stageConfig, deals, onCloseDeal }: KanbanColumnProps) {
  const { formatMoneyCompact, formatMoney, formatRegionDate } = useRegion();
  const { user } = useAuth();
  const userCurrency = user?.currency || 'USD';
  
  console.log('KanbanColumn - User currency:', userCurrency);
  console.log('KanbanColumn - Deals:', deals);
  
  // Group deals by currency for the total display (using user's preferred currency)
  const currencyGroups = deals.reduce((acc, deal) => {
    console.log('Deal:', deal.id, 'value:', deal.value, 'baseCurrency:', deal.baseCurrency);
    // Convert deal value from base currency to user's preferred currency
    const convertedValue = convertCurrency(deal.value, deal.baseCurrency, userCurrency);
    acc[userCurrency] = (acc[userCurrency] || 0) + convertedValue;
    return acc;
  }, {} as Record<string, number>);

  const currencies = Object.keys(currencyGroups);
  const hasMultipleCurrencies = currencies.length > 1;

  // Format the total value display
  const formatTotalValue = () => {
    if (deals.length === 0) return 'No deals';
    const totalValue = currencyGroups[userCurrency] || 0;
    return formatMoneyCompact(totalValue, userCurrency);
  };

  return (
    <div className="space-y-4">
      {/* Column header */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-foreground">{stageConfig.label}</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {deals.length} deal{deals.length !== 1 ? 's' : ''} • {formatTotalValue()}
            </p>
          </div>
          <Badge variant="default" size="sm">{deals.length}</Badge>
        </div>
      </div>

      {/* Deal cards */}
      <div className="space-y-2">
        {deals.length === 0 ? (
          <Card className="text-center py-8">
            <p className="text-sm text-muted-foreground">No deals</p>
          </Card>
        ) : (
          deals.map((deal, index) => (
            <motion.div key={deal.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
              <Card className="p-4 hover:shadow-lg hover:border-accent/50 transition-all duration-200">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-medium text-foreground text-sm line-clamp-2 flex-1">{deal.title}</h4>
                    {onCloseDeal && (
                      <button
                        onClick={() => onCloseDeal(deal.id)}
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
                      <p className="font-semibold text-sm text-primary">
                        {formatMoney(convertCurrency(deal.value, deal.baseCurrency, userCurrency), userCurrency)}
                      </p>
                    </div>
                    <Badge variant={deal.priority === 'high' ? 'error' : deal.priority === 'medium' ? 'warning' : 'info'} size="sm">
                      {deal.priority}
                    </Badge>
                  </div>

                  {deal.expectedCloseDate && (
                    <p className="text-xs text-muted-foreground">
                      Close: {formatRegionDate(deal.expectedCloseDate, { month: 'short', day: 'numeric' })}
                    </p>
                  )}

                  {deal.contact && (
                    <p className="text-xs text-muted-foreground">
                      {deal.contact.firstName} {deal.contact.lastName}
                    </p>
                  )}
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
