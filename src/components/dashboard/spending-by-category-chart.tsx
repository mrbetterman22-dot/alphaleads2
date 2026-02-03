'use client';

import { Pie, PieChart, Cell } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import type { Transaction } from '@/lib/types';
import { useData } from '@/context/data-provider';

interface SpendingByCategoryChartProps {
  data: Transaction[];
}

export function SpendingByCategoryChart({
  data,
}: SpendingByCategoryChartProps) {
  const { getCategory } = useData();

  const categorySpending = data
    .filter((t) => t.amount < 0)
    .reduce((acc, transaction) => {
      const { category, amount } = transaction;
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category] += Math.abs(amount);
      return acc;
    }, {} as Record<string, number>);

  const chartData = Object.entries(categorySpending)
    .map(([categoryId, total]) => {
      const category = getCategory(categoryId);
      return {
        name: category?.name || 'Uncategorized',
        value: total,
        fill: category?.color || 'hsl(var(--muted-foreground))',
      };
    })
    .sort((a, b) => b.value - a.value);

  const chartConfig = Object.fromEntries(
    chartData.map((item) => [
      item.name,
      { label: item.name, color: item.fill },
    ])
  );

  const rawCurrency = data[0]?.currency || '$';
  const currency = rawCurrency.length > 3 ? rawCurrency.substring(0, 3) : rawCurrency;

  const topCategory = chartData[0]?.name || 'N/A';

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Spending by Category</CardTitle>
        <CardDescription>July 2024</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  formatter={(value, name) =>
                    `${name}: ${currency} ${Number(value).toLocaleString('en-US')}`
                  }
                />
              }
            />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius="60%"
            >
              {chartData.map((entry) => (
                <Cell key={`cell-${entry.name}`} fill={entry.fill} />
              ))}
            </Pie>
            <ChartLegend
              content={<ChartLegendContent nameKey="name" className="flex-wrap" />}
              className="-mt-4 flex-wrap justify-center"
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm pt-8">
        <div className="flex items-center gap-2 font-medium leading-none text-muted-foreground">
          {topCategory} is your highest spending category this month.
        </div>
      </CardFooter>
    </Card>
  );
}