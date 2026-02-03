
'use client';

import { TransactionsDataTable } from '@/components/transactions/data-table';
import { UploadDialog } from '@/components/transactions/upload-dialog';
import { useData } from '@/context/data-provider';
import type { Transaction, Statement } from '@/lib/types';
import { Dropzone } from '@/components/transactions/dropzone';
import { useState } from 'react';

export default function TransactionsPage() {
  const { transactions, addTransactions, setPendingAmount, addStatements } = useData();
  const [isLoading, setIsLoading] = useState(false);

  const handleNewTransactions = (
    newTransactions: Transaction[],
    newStatements: Statement[],
    totalPending: number
  ) => {
    addTransactions(newTransactions);
    addStatements(newStatements)
    if (totalPending) {
      setPendingAmount(prev => prev + totalPending);
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      {(transactions.length > 0 && !isLoading) ? (
        <>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Transactions</h1>
            <UploadDialog onNewTransactions={handleNewTransactions} />
          </div>
          <TransactionsDataTable data={transactions} />
        </>
      ) : (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm h-full">
          <Dropzone onProcessingStart={() => setIsLoading(true)} onNewTransactions={handleNewTransactions} isProcessing={isLoading}/>
        </div>
      )}
    </div>
  );
}
