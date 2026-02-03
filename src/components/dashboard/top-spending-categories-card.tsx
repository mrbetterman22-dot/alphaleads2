'use client';

import { useData } from '@/context/data-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function TopSpendingCategoriesCard() {
  const { transactions, getCategory } = useData();

  const spendingByCategory = transactions
    .filter((t) => t.amount < 0 && t.category !== 'income')
    .reduce((acc, transaction) => {
      const { category, amount } = transaction;
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category] += Math.abs(amount);
      return acc;
    }, {} as Record<string, number>);

  const top3 = Object.entries(spendingByCategory)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  // SANITIZE: Force max 3 chars for currency
  const rawCurrency = transactions[0]?.currency || '$';
  const currency = rawCurrency.length > 3 ? rawCurrency.substring(0, 3) : rawCurrency;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top 3 Spending Categories</CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {top3.map(([categoryId, amount]) => {
            const category = getCategory(categoryId);
            const Icon = category?.icon;
            return (
              <div
                key={categoryId}
                className="flex flex-col p-4 bg-muted/50 rounded-3xl"
              >
                <div className="flex items-center gap-2 mb-2">
                  {Icon && typeof Icon === 'function' && (
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  )}
                  <h3 className="font-semibold text-sm">
                    {category?.name || 'Uncategorized'}
                  </h3>
                </div>
                <p className="text-2xl font-bold">
                  {currency}{' '}
                  {amount.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}