'use server';

/**
 * @fileOverview Summarizes spending based on user questions using GenAI.
 *
 * - summarizeSpending - A function that takes a user question and transaction data, and returns a summary.
 * - SummarizeSpendingInput - The input type for the summarizeSpending function.
 * - SummarizeSpendingOutput - The return type for the summarizeSpending function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeSpendingInputSchema = z.object({
  question: z.string().describe('The user question about their spending.'),
  transactionData: z.string().describe('JSON string of the transaction data.'),
});
export type SummarizeSpendingInput = z.infer<typeof SummarizeSpendingInputSchema>;

const SummarizeSpendingOutputSchema = z.object({
  summary: z.string().describe('The summary of the spending based on the user question.'),
});
export type SummarizeSpendingOutput = z.infer<typeof SummarizeSpendingOutputSchema>;

export async function summarizeSpending(input: SummarizeSpendingInput): Promise<SummarizeSpendingOutput> {
  return summarizeSpendingFlow(input);
}

const summarizeSpendingPrompt = ai.definePrompt({
  name: 'summarizeSpendingPrompt',
  input: {schema: SummarizeSpendingInputSchema},
  output: {schema: SummarizeSpendingOutputSchema},
  prompt: `You are a personal finance expert. Use the provided transaction data to answer the user's question about their spending. Be concise and clear in your summary.\n\nUser Question: {{{question}}}\n\nTransaction Data: {{{transactionData}}}`,
});

const summarizeSpendingFlow = ai.defineFlow(
  {
    name: 'summarizeSpendingFlow',
    inputSchema: SummarizeSpendingInputSchema,
    outputSchema: SummarizeSpendingOutputSchema,
  },
  async input => {
    try {
      const {output} = await summarizeSpendingPrompt(input);
      return output!;
    } catch (err) {
      console.error('summarizeSpendingPrompt failed', err);
      // Fallback so the UI keeps working even if the AI call fails.
      return { summary: 'Unable to generate a summary at this time.' };
    }
  }
);
