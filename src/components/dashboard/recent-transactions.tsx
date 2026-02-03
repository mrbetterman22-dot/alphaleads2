'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useData } from '@/context/data-provider';

export function RecentTransactions() {
  const { transactions: allTransactions, getCategory } = useData();
  const transactions = allTransactions.slice(0, 5);
  
  // SANITIZE: Force max 3 chars for currency
  const rawCurrency = allTransactions[0]?.currency || '$';
  const currency = rawCurrency.length > 3 ? rawCurrency.substring(0, 3) : rawCurrency;


  return (
    <Card>
      <CardHeader className="flex flex-row items-center">
        <div className="grid gap-2">
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>
            You have {allTransactions.length} transactions this month.
          </CardDescription>
        </div>
        <Button asChild size="sm" className="ml-auto gap-1">
          <Link href="/transactions">
            View All
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="grid gap-6">
        {transactions.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            No recent transactions.
          </div>
        )}
        {transactions.map((transaction) => {
          const category = getCategory(transaction.category);
          const Icon = category?.icon;
          return (
            <div key={transaction.id} className="flex items-center gap-4">
              <Avatar className="hidden h-9 w-9 sm:flex">
                <AvatarFallback
                  className={cn(
                    transaction.amount > 0 ? 'bg-green-100 text-green-600' : ''
                  )}
                >
                  {Icon && typeof Icon === 'function' && <Icon className="h-5 w-5" />}
                </AvatarFallback>
              </Avatar>
              <div className="grid gap-1">
                <p className="text-sm font-medium leading-none">
                  {transaction.description}
                </p>
                <p className="text-sm text-muted-foreground">
                  {category?.name || 'Uncategorized'}
                </p>
              </div>
              <div
                className={cn(
                  'ml-auto font-medium',
                  transaction.amount > 0 ? 'text-green-600' : ''
                )}
              >
                {transaction.amount > 0 ? '+' : ''}
                {currency}{' '}
                {Math.abs(transaction.amount).toFixed(2)}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}