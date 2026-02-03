'use client';

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useData } from '@/context/data-provider';
import type { Transaction } from '@/lib/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, ClipboardCopy, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const PAGE_SIZE = 10;

export function TransactionsDataTable({ data }: { data: Transaction[] }) {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [searchQuery, setSearchQuery] = React.useState('');
  const { toast } = useToast();
  const { categories, getCategory, updateTransaction } = useData();

  const handleCategoryChange = (transactionId: string, newCategoryId: string) => {
    updateTransaction(transactionId, newCategoryId);
    toast({
      title: 'Category Updated',
      description: 'The transaction category has been changed.',
    });
  };

  const filteredData = data
    .filter((transaction) =>
      transaction.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);

  const paginatedData = filteredData.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleCopyToCSV = () => {
    const csvHeader = ['Date', 'Description', 'Bank', 'Category', 'Amount', 'Currency']
      .map((h) => `"${h}"`)
      .join(',');

    const csvRows = filteredData
      .map((t) => {
        const category = getCategory(t.category);
        // Clean currency for CSV as well
        let cleanCurrency = t.currency || 'USD';
        if (cleanCurrency.length > 3) cleanCurrency = cleanCurrency.substring(0, 3);

        const row = [
          format(new Date(t.date), 'yyyy-MM-dd'),
          t.description,
          t.bank || 'N/A',
          category?.name || 'N/A',
          t.amount.toString(),
          cleanCurrency
        ];
        return row
          .map((field) => `"${String(field).replace(/"/g, '""')}"`)
          .join(',');
      })
      .join('\n');

    const csvContent = `${csvHeader}\n${csvRows}`;
    navigator.clipboard.writeText(csvContent).then(
      () => {
        toast({
          title: 'Copied to Clipboard',
          description: `${filteredData.length} transactions have been copied as CSV.`,
        });
      },
      (err) => {
        console.error('Could not copy text: ', err);
        toast({
          variant: 'destructive',
          title: 'Copy Failed',
          description: 'Could not copy transactions to clipboard.',
        });
      }
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-4 pb-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search descriptions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-3xl border-slate-200 dark:border-white/20 bg-white/60 dark:bg-black/60 backdrop-blur-2xl"
          />
        </div>
        <Button
          variant="outline"
          onClick={handleCopyToCSV}
          className="rounded-3xl border-slate-200 dark:border-white/20 bg-white/60 dark:bg-black/60 backdrop-blur-2xl hover:bg-white/70 dark:hover:bg-black/70 transition-all duration-300"
        >
          <ClipboardCopy className="mr-2 h-4 w-4" />
          Copy CSV
        </Button>
      </div>
      <div className="rounded-3xl border border-slate-200 dark:border-white/20 bg-white/60 dark:bg-black/60 backdrop-blur-2xl overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Bank</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((transaction) => {
                const category = getCategory(transaction.category);
                const Icon = category?.icon;

                // --- SANITIZE CURRENCY DISPLAY ---
                // If it is long (like "RON, Bank..."), cut it to 3 chars ("RON")
                const rawCurrency = transaction.currency || '$';
                const currency = rawCurrency.length > 3 ? rawCurrency.substring(0, 3) : rawCurrency;
                // ---------------------------------

                return (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">
                      {format(new Date(transaction.date), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell>{transaction.bank || 'N/A'}</TableCell>
                    <TableCell>
                      <Select
                        value={transaction.category}
                        onValueChange={(newCategory) =>
                          handleCategoryChange(transaction.id, newCategory)
                        }
                      >
                        <SelectTrigger className="text-xs h-8">
                          <SelectValue>
                            <div className='flex items-center gap-2'>
                              {Icon && typeof Icon === 'function' && <Icon className='h-4 w-4' />}
                              <span>{category?.name || 'N/A'}</span>
                            </div>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => {
                            const CatIcon = cat.icon;
                            return (
                              <SelectItem key={cat.id} value={cat.id}>
                                <div className='flex items-center gap-2'>
                                  {CatIcon && typeof CatIcon === 'function' && <CatIcon className='h-4 w-4' />}
                                  <span>{cat?.name}</span>
                                </div>
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell
                      className={cn(
                        'text-right font-mono',
                        transaction.amount > 0 ? 'text-green-600' : ''
                      )}
                    >
                      {transaction.amount < 0 ? '-' : '+'}
                      {currency}{' '}
                      {`${Math.abs(transaction.amount).toFixed(2)}`}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          Page {totalPages > 0 ? currentPage : 0} of {totalPages}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevPage}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNextPage}
          disabled={currentPage === totalPages || totalPages === 0}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}