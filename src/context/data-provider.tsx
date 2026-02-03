'use client';

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
  useEffect,
} from 'react';
import type { Statement, Transaction, Category } from '@/lib/types';
import { categories as defaultCategories } from '@/lib/data';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle } from 'lucide-react';

interface DataContextType {
  statements: Statement[];
  transactions: Transaction[];
  categories: Category[];
  pendingAmount: number;
  addStatements: (statements: Statement[]) => void;
  addTransactions: (transactions: Transaction[]) => void;
  updateTransaction: (transactionId: string, newCategoryId: string) => void;
  setPendingAmount: (updater: (prev: number) => number) => void;
  clearData: () => void;
  getCategory: (categoryId: string) => Category | undefined;
  addCategory: (name: string) => void;
  updateCategory: (id: string, name: string) => void;
  deleteCategory: (id: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [statements, setStatements] = useState<Statement[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [pendingAmount, setPendingAmount] = useState<number>(0);
  const { toast } = useToast();
  const supabase = createClientComponentClient();

  // 1. Fetch Data on Load
  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch Transactions
      const { data: txData } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id);

      if (txData) setTransactions(txData);

      // Fetch Statements
      const { data: stmtData } = await supabase
        .from('statements')
        .select('*')
        .eq('user_id', user.id);

      if (stmtData) setStatements(stmtData);
    };

    fetchData();
  }, []);

  // 2. Add Data (Sync to Supabase)
  const addStatements = async (newStatements: Statement[]) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error("DEBUG: No user found in addStatements. Cannot save.");
      return;
    }

    const statementsWithUser = newStatements.map(s => ({ ...s, user_id: user.id }));

    // Update Local State
    setStatements((prev) => [...prev, ...newStatements]);

    // Update Supabase
    const { error } = await supabase.from('statements').insert(statementsWithUser);
    if (error) {
      console.error('Error saving statements (Full Object):', error);
      console.error('Error saving statements (Message):', error.message);
      console.error('Error saving statements (Details):', error.details);
      console.error('Error saving statements (Hint):', error.hint);
    }
  };

  const addTransactions = async (newTransactions: Transaction[]) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error("DEBUG: No user found in addTransactions. Cannot save.");
      return;
    }

    const transactionsWithUser = newTransactions.map(t => ({ ...t, user_id: user.id }));

    // Update Local State
    setTransactions((prev) => [...newTransactions, ...prev]);

    // Update Supabase
    const { error } = await supabase.from('transactions').insert(transactionsWithUser);
    if (error) console.error('Error saving transactions:', error);
  };

  // 3. Update Transaction Category
  const updateTransaction = async (transactionId: string, newCategoryId: string) => {
    // Local Update
    setTransactions((prev) =>
      prev.map((t) =>
        t.id === transactionId ? { ...t, category: newCategoryId } : t
      )
    );

    // Supabase Update
    const { error } = await supabase
      .from('transactions')
      .update({ category: newCategoryId })
      .eq('id', transactionId);

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save category change.' });
    }
  };

  const clearData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setStatements([]);
    setTransactions([]);
    setPendingAmount(0);

    // Delete from Supabase
    await supabase.from('transactions').delete().eq('user_id', user.id);
    await supabase.from('statements').delete().eq('user_id', user.id);
  };

  // Categories logic remains largely local/static for simplicity in this step
  // You can expand this to a 'categories' table in Supabase later.
  const getCategory = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId);
  };

  const addCategory = (name: string) => {
    const newCategory: Category = {
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name,
      icon: PlusCircle,
      color: `hsl(${Math.random() * 360}, 70%, 50%)`,
    };
    setCategories((prev) => [...prev, newCategory]);
  };

  const updateCategory = (id: string, name: string) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, name: name } : c))
    );
  };

  const deleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <DataContext.Provider
      value={{
        statements,
        transactions,
        categories,
        pendingAmount,
        setPendingAmount,
        addStatements,
        addTransactions,
        updateTransaction,
        clearData,
        getCategory,
        addCategory,
        updateCategory,
        deleteCategory,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}