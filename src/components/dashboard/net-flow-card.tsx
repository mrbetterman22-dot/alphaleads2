'use client';

import { Activity } from 'lucide-react';
import { StatCard } from '@/components/dashboard/stat-card';
import { useData } from '@/context/data-provider';

export function NetFlowCard() {
  const { transactions } = useData();

  const totalSpending = transactions
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalIncome = transactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const netFlow = totalIncome + totalSpending;

  // SANITIZE: Force max 3 chars for currency
  const rawCurrency = transactions[0]?.currency || '$';
  const currency = rawCurrency.length > 3 ? rawCurrency.substring(0, 3) : rawCurrency;

  return (
    <StatCard
      title="Net Flow"
      value={`${netFlow > 0 ? '+' : '-'}${currency} ${Math.abs(netFlow).toLocaleString(
        'en-US',
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }
      )}`}
      description="Last 90 days"
      icon={Activity}
    />
  );
}