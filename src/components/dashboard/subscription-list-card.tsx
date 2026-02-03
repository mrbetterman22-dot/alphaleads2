'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useData } from '@/context/data-provider';
import { Repeat } from 'lucide-react';

export function SubscriptionListCard() {
  const { transactions } = useData();

  const aggregatedSubscriptions = transactions
    .filter((t) => t.category === 'subscriptions' && t.amount < 0)
    .reduce((acc, sub) => {
      if (!acc[sub.description]) {
        acc[sub.description] = 0;
      }
      acc[sub.description] += sub.amount;
      return acc;
    }, {} as Record<string, number>);

  const subscriptionList = Object.entries(aggregatedSubscriptions).map(
    ([description, amount]) => ({
      id: description, // Use description as a unique key for the list
      description,
      amount,
    })
  );

  const totalSubscriptionSpending = subscriptionList.reduce(
    (sum, t) => sum + t.amount,
    0
  );

  // SANITIZE: Force max 3 chars for currency
  const rawCurrency = transactions[0]?.currency || '$';
  const currency = rawCurrency.length > 3 ? rawCurrency.substring(0, 3) : rawCurrency;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Subscriptions</CardTitle>
          <Repeat className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold mb-2">
          {currency}{' '}
          {Math.abs(totalSubscriptionSpending).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </div>
        <div className="space-y-2 text-sm">
          {subscriptionList.length > 0 ? (
            subscriptionList.map((sub) => (
              <div key={sub.id} className="flex justify-between">
                <p className="text-muted-foreground truncate pr-2">
                  {sub.description}
                </p>
                <p className="font-medium">
                  {currency} {Math.abs(sub.amount).toFixed(2)}
                </p>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground">No subscriptions found.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}