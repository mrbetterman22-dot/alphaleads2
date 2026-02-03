'use client';

import {
  DollarSign,
  CreditCard,
  Trash2,
} from 'lucide-react';
import { StatCard } from '@/components/dashboard/stat-card';
import { MonthlySpendingChart } from '@/components/dashboard/monthly-spending-chart';
import { SpendingByCategoryChart } from '@/components/dashboard/spending-by-category-chart';
import { RecentTransactions } from '@/components/dashboard/recent-transactions';
import { Button } from '@/components/ui/button';
import { useData } from '@/context/data-provider';
import { NetFlowCard } from '@/components/dashboard/net-flow-card';
import { TopSpendingCategoriesCard } from '@/components/dashboard/top-spending-categories-card';
import { UploadDialog } from '@/components/transactions/upload-dialog';
import type { Transaction, Statement } from '@/lib/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Dropzone } from '@/components/transactions/dropzone';
import { useState } from 'react';
import { SubscriptionListCard } from '@/components/dashboard/subscription-list-card';

export default function DashboardPage() {
  const {
    transactions,
    pendingAmount,
    addTransactions,
    setPendingAmount,
    addStatements,
    clearData,
  } = useData();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleClearData = () => {
    clearData();
    toast({
      title: 'Data Cleared',
      description: 'All your transaction data has been removed.',
    });
  };

  const handleNewTransactions = (
    newTransactions: Transaction[],
    newStatements: Statement[],
    totalPending: number
  ) => {
    addTransactions(newTransactions);
    addStatements(newStatements);
    if (totalPending) {
      setPendingAmount(prev => prev + totalPending);
    }
    setIsLoading(false);
  };

  const totalSpending = transactions
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalIncome = transactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  // SANITIZE CURRENCY: Get raw value, keep only first 3 chars if it's text (e.g. RON), or 1 char if symbol ($)
  const rawCurrency = transactions[0]?.currency || '$';
  const currency = rawCurrency.length > 3 ? rawCurrency.substring(0, 3) : rawCurrency;

  if (transactions.length === 0 && !isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm h-full">
        <Dropzone onProcessingStart={() => setIsLoading(true)} onNewTransactions={handleNewTransactions} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm h-full">
        <Dropzone onProcessingStart={() => setIsLoading(true)} onNewTransactions={handleNewTransactions} isProcessing={true} />
      </div>
    )
  }

  return (
    <div className="relative min-h-screen space-y-6">
      {/* Background Gradients */}
      <div className="pointer-events-none fixed inset-0 -z-10 h-full w-full bg-[#fafafa] dark:bg-[#0a0a0a]">
        <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-blue-400/20 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-purple-400/20 blur-[100px]" />
        <div className="absolute top-[40%] left-[40%] h-[400px] w-[400px] rounded-full bg-yellow-400/10 blur-[100px]" />
      </div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Clear All Data
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete all
                  your statements and transactions from the application.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearData}>
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <UploadDialog onNewTransactions={handleNewTransactions} />
        </div>
      </div>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Spending"
          value={`${currency} ${Math.abs(totalSpending).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          description="Last 90 days"
          icon={DollarSign}
        />
        <StatCard
          title="Total Income"
          value={`${currency} ${totalIncome.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          description="Last 90 days"
          icon={DollarSign}
        />
        <NetFlowCard />
        <StatCard
          title="Total Money Pending"
          value={`${currency} ${Math.abs(pendingAmount).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          description="From statement"
          icon={CreditCard}
        />
      </div>
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <MonthlySpendingChart data={transactions} />
        <SpendingByCategoryChart data={transactions} />
      </div>
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <TopSpendingCategoriesCard />
        <SubscriptionListCard />
      </div>
      <div className="grid gap-4">
        <RecentTransactions />
      </div>
    </div>
  );
}