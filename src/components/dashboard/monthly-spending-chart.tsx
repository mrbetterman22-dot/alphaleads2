'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { format } from 'date-fns';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { Transaction } from '@/lib/types';

interface MonthlySpendingChartProps {
  data: Transaction[];
}

export function MonthlySpendingChart({ data }: MonthlySpendingChartProps) {
  const monthlySpending = data
    .filter((t) => t.amount < 0 && t.category !== 'housing')
    .reduce((acc, transaction) => {
      const month = format(new Date(transaction.date), 'yyyy-MM');
      const amount = Math.abs(transaction.amount);
      if (!acc[month]) {
        acc[month] = 0;
      }
      acc[month] += amount;
      return acc;
    }, {} as Record<string, number>);

  const chartData = Object.entries(monthlySpending)
    .map(([month, total]) => ({
      month,
      displayMonth: format(new Date(month), 'MMM'),
      total: total,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const chartConfig = {
    total: {
      label: 'Total',
      color: 'hsl(var(--chart-1))',
    },
  };

  // SANITIZE: Force max 3 chars for currency
  const rawCurrency = data[0]?.currency || '$';
  const currency = rawCurrency.length > 3 ? rawCurrency.substring(0, 3) : rawCurrency;

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle>Monthly Spending</CardTitle>
        <CardDescription>April - July 2024 (excluding rent)</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="w-full">
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="displayMonth"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <YAxis
              tickFormatter={(value) => `${currency}${value / 1000}k`}
              tickLine={false}
              axisLine={false}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Bar dataKey="total" fill="var(--color-total)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}