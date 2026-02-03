import { createClient } from '@supabase/supabase-js';
import { Transaction } from './types'; // Import Transaction type

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function uploadTransactions(transactions: Transaction[]) {
  const { data, error } = await supabase
    .from('transactions')
    .insert(transactions);

  if (error) {
    console.error('Error uploading transactions:', error);
    throw error;
  }

  return data;
}