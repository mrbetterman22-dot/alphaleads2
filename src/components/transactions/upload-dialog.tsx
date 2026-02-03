'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { UploadCloud, WandSparkles, File as FileIcon, X } from 'lucide-react';
import { useState, useRef, type ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';

import { useData } from '@/context/data-provider';
import type { Transaction, Statement } from '@/lib/types';
import { ScrollArea } from '../ui/scroll-area';
import { parseCsvTransactions } from '@/lib/utils';
import { uploadTransactions } from '@/lib/supabase';

interface UploadDialogProps {
  onNewTransactions: (
    transactions: Transaction[],
    statements: Statement[],
    totalPending: number
  ) => void;
  children?: ReactNode;
}

export function UploadDialog({
  onNewTransactions,
  children,
}: UploadDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { statements, categories } = useData();
  const categoryIds = new Set(categories.map(c => c.id));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (selectedFiles: File[]) => {
    if (files.length + selectedFiles.length > 5) {
      toast({
        variant: 'destructive',
        title: 'Too many files',
        description: 'You can upload a maximum of 5 files at a time.',
      });
      return;
    }

    const newFiles = selectedFiles.filter(file => {
      if (
        file.type !== 'application/pdf' &&
        file.type !== 'text/csv' &&
        !file.name.endsWith('.csv') // Fallback for browsers that don't set type for CSV
      ) {
        toast({
          variant: 'destructive',
          title: 'Invalid File Type',
          description: `"${file.name}" is not a PDF or CSV and will be skipped.`,
        });
        return false;
      }
      // Increased check to match server limit
      if (file.size > 10 * 1024 * 1024) {
        toast({
          variant: 'destructive',
          title: 'File Too Large',
          description: `"${file.name}" is larger than 10MB and will be skipped.`,
        });
        return false;
      }
      if (statements.some(s => s.name === file.name) || files.some(f => f.name === file.name)) {
        toast({
          variant: 'destructive',
          title: 'Duplicate File',
          description: `"${file.name}" has already been added or uploaded.`,
        });
        return false;
      }
      return true;
    });

    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleRemoveFile = (fileName: string) => {
    setFiles(prev => prev.filter(f => f.name !== fileName));
  };

  const handleProcess = async () => {
    if (files.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No Files Selected',
        description: 'Please select one or more PDF or CSV files to process.',
      });
      return;
    }

    setIsProcessing(true);
    const allNewTransactions: Transaction[] = [];
    const allNewStatements: Statement[] = [];
    let totalPendingAmount = 0;

    const pdfFiles = files.filter(file => file.type === 'application/pdf');
    const csvFiles = files.filter(file => file.type === 'text/csv' || file.name.endsWith('.csv'));

    // Process PDF files
    for (const file of pdfFiles) {
      try {
        setProcessingStep(`Processing ${file.name}...`);

        const pdfDataUri = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (error) => reject(error);
        });

        setProcessingStep(`Extracting transactions from ${file.name}`);
        const response = await fetch('/api/extract', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            pdfDataUri,
            categories: categories.map(c => ({ id: c.id, name: c.name })),
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to extract transactions.');
        }

        const extractedData: {
          transactions: Partial<Transaction>[];
          bankName: string;
          pendingAmount: number;
        } = await response.json();

        if (!extractedData || !extractedData.transactions) {
          throw new Error("No data returned from AI");
        }

        const categorized = extractedData.transactions
          .filter(t => t.date && t.description && t.amount)
          .map((t) => ({
            id: `new-${crypto.randomUUID()}`,
            date: t.date!,
            description: t.description!,
            amount: t.amount!,
            category: categoryIds.has(t.category!) ? t.category! : 'uncategorized',
            currency: t.currency,
            bank: t.bank || extractedData.bankName || 'N/A',
          }));

        allNewTransactions.push(...categorized);
        allNewStatements.push({
          id: `stmt-${crypto.randomUUID()}`,
          name: file.name,
          date: new Date().toISOString(),
          transactionCount: categorized.length,
        });

        if (extractedData.pendingAmount) {
          totalPendingAmount += extractedData.pendingAmount;
        }

      } catch (error) {
        console.error(`Failed to process ${file.name}`, error);
        toast({
          variant: 'destructive',
          title: `Error processing ${file.name}`,
          description: 'Could not process the statement. Check server logs.',
        });
      }
    }

    // Process CSV files
    for (const file of csvFiles) {
      try {
        setProcessingStep(`Uploading ${file.name}...`);

        const csvString = await file.text();
        const parsedTransactions = parseCsvTransactions(csvString);

        if (parsedTransactions.length === 0) {
          toast({
            variant: 'default',
            title: `No transactions found in ${file.name}`,
            description: 'The CSV file was parsed but no valid transactions were found.',
          });
          continue;
        }

        await uploadTransactions(parsedTransactions);

        allNewTransactions.push(...parsedTransactions);
        allNewStatements.push({
          id: `stmt-${crypto.randomUUID()}`,
          name: file.name,
          date: new Date().toISOString(),
          transactionCount: parsedTransactions.length,
        });

        toast({
          title: `CSV Uploaded: ${file.name}`,
          description: `${parsedTransactions.length} transactions uploaded successfully.`,
        });

      } catch (error) {
        console.error(`Failed to upload CSV ${file.name}`, error);
        toast({
          variant: 'destructive',
          title: `Error uploading CSV ${file.name}`,
          description: 'Could not upload CSV file. Check console for details.',
        });
      }
    }

    if (allNewTransactions.length > 0) {
      onNewTransactions(allNewTransactions, allNewStatements, totalPendingAmount);
      toast({
        title: 'Files Processed',
        description: `${allNewTransactions.length} new transactions have been added from ${files.length} files.`,
      });
    }

    setIsProcessing(false);
    setProcessingStep('');
    setFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setIsOpen(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (isProcessing) return;
    setIsOpen(open);
    if (!open) {
      setFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children || (
          <Button className="!border-[#fee100]/40 !bg-[#fee100] !text-slate-900 hover:!bg-[#ffd700] hover:!text-slate-900">
            <UploadCloud className="mr-2 h-4 w-4" />
            Upload Statement
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upload Statement</DialogTitle>
          <DialogDescription>
            Choose bank statements in PDF or CSV format to add more transactions.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <input
            ref={fileInputRef}
            id="file-upload"
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept="application/pdf, text/csv"
            multiple
          />
          <Button asChild variant="outline" className="w-full">
            <label htmlFor="file-upload">
              <UploadCloud className="mr-2 h-4 w-4" />
              Choose File(s)
            </label>
          </Button>

          {files.length > 0 && (
            <div className="w-full">
              <p className="text-sm font-medium mb-2">Selected file:</p>
              <ScrollArea className="h-32">
                <div className="space-y-2">
                  {files.map(file => (
                    <div key={file.name} className="flex items-center justify-between p-2 rounded-md border text-sm">
                      <div className="flex items-center gap-2 truncate">
                        <FileIcon className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{file.name}</span>
                      </div>
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleRemoveFile(file.name)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          <Button onClick={handleProcess} disabled={files.length === 0 || isProcessing}>
            <WandSparkles className="mr-2 h-4 w-4" />
            {isProcessing ? processingStep : `Process ${files.length} File(s)`}
          </Button>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isProcessing}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}