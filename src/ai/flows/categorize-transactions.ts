'use server';

/**
 * @fileOverview Transaction categorization flow using a generative AI model.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const TransactionSchema = z.object({
  id: z.string().describe('The unique identifier of the transaction.'),
  date: z.string().describe('The date of the transaction.'),
  description: z.string().describe('A description of the transaction.'),
  amount: z.number().describe('The amount of the transaction.'),
  currency: z.string().optional().describe('The currency of the transaction.'),
  bank: z.string().optional().describe('The name of the bank.'),
});

export type Transaction = z.infer<typeof TransactionSchema>;

const CategoryInfoSchema = z.object({
  id: z.string().describe('The unique ID of the category.'),
  name: z.string().describe('The display name of the category.')
});

const CategorizeTransactionsInputSchema = z.object({
  transactions: z.array(TransactionSchema).describe('An array of transactions to categorize.'),
  categories: z.array(CategoryInfoSchema).describe('An array of available categories with their IDs and names.'),
});

export type CategorizeTransactionsInput = z.infer<typeof CategorizeTransactionsInputSchema>;

const CategorizeTransactionsOutputSchema = z.object({
  categorizedTransactions: z.array(
    TransactionSchema.extend({
      category: z.string().describe('The category ID of the transaction.'),
    })
  ).describe('The list of transactions, with category IDs added.'),
});

export type CategorizeTransactionsOutput = z.infer<typeof CategorizeTransactionsOutputSchema>;

// THIS IS THE CRITICAL EXPORT
export async function categorizeTransactions(input: CategorizeTransactionsInput): Promise<CategorizeTransactionsOutput> {
  return categorizeTransactionsFlow(input);
}

const categorizeTransactionsPrompt = ai.definePrompt({
  name: 'categorizeTransactionsPrompt',
  input: { schema: CategorizeTransactionsInputSchema },
  output: { schema: CategorizeTransactionsOutputSchema },
  prompt: `You are a financial expert specializing in categorizing bank transactions.

  Your task is to categorize each transaction provided into one of the available categories listed below.
  When you return the result, you MUST use the 'id' of the category, not its 'name'.

  Available Categories (use the 'id' in your response):
  {{#each categories}}
  - id: {{id}}, name: {{name}}
  {{/each}}
  
  Your primary goal is to use the most appropriate category from the list provided.

  - If the transaction description contains the words "transfer" or "sent", you MUST categorize it using the category ID 'transfer'.
  - If a transaction cannot be clearly matched to any of the provided categories, you MUST use the category ID 'uncategorized'. Do not invent new categories.

  Transactions to process:
  {{#each transactions}}
  - ID: {{id}}, Date: {{date}}, Description: {{description}}, Amount: {{amount}}, Currency: {{currency}}, Bank: {{bank}}
  {{/each}}

  Return a JSON object with the 'categorizedTransactions' field populated. Each transaction in the array should include its original information plus the assigned 'category' ID. You must only use the category IDs provided. If you cannot determine a category, use 'uncategorized'.`,
});

const categorizeTransactionsFlow = ai.defineFlow(
  {
    name: 'categorizeTransactionsFlow',
    inputSchema: CategorizeTransactionsInputSchema,
    outputSchema: CategorizeTransactionsOutputSchema,
  },
  async input => {
    try {
      const { output } = await categorizeTransactionsPrompt(input);
      return output!;
    } catch (err) {
      console.error('categorizeTransactionsPrompt failed', err);
      // Fallback so the UI keeps working even if the AI call fails.
      throw err;
    }
  }
);