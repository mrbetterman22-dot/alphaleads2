import {
  ArrowRightLeft,
  Car,
  Clapperboard,
  Coffee,
  HeartPulse,
  Home,
  Pizza,
  Receipt,
  Repeat,
  ShoppingBasket,
  Ticket,
  Wallet,
} from 'lucide-react';
import type { Category, Statement, Transaction } from './types';

export const categories: Category[] = [
  { id: 'groceries', name: 'Groceries', icon: ShoppingBasket, color: 'hsl(var(--chart-1))' },
  { id: 'dining', name: 'Dining', icon: Pizza, color: 'hsl(var(--chart-2))' },
  { id: 'entertainment', name: 'Entertainment', icon: Clapperboard, color: 'hsl(var(--chart-3))' },
  { id: 'utilities', name: 'Utilities', icon: Receipt, color: 'hsl(var(--chart-4))' },
  { id: 'transport', name: 'Transport', icon: Car, color: 'hsl(var(--chart-5))' },
  { id: 'health', name: 'Health', icon: HeartPulse, color: 'hsl(var(--chart-1))' },
  { id: 'shopping', name: 'Shopping', icon: Ticket, color: 'hsl(var(--chart-2))' },
  { id: 'housing', name: 'Housing', icon: Home, color: 'hsl(var(--chart-3))' },
  { id: 'subscriptions', name: 'Subscriptions', icon: Repeat, color: 'hsl(var(--chart-4))' },
  { id: 'coffee', name: 'Coffee', icon: Coffee, color: 'hsl(var(--chart-5))' },
  { id: 'transfer', name: 'Transfer', icon: ArrowRightLeft, color: 'hsl(var(--muted-foreground))' },
  { id: 'uncategorized', name: 'Uncategorized', icon: Wallet, color: 'hsl(var(--muted-foreground))' },
  { id: 'income', name: 'Income', icon: Wallet, color: 'hsl(var(--green-500))' },
];

export const transactions: Transaction[] = [];

export const statements: Statement[] = [];
