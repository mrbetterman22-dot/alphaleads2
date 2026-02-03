'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const CategoryInfoSchema = z.object({
  id: z.string().describe('The unique ID of the category.'),
  name: z.string().describe('The display name of the category.')
});

const ExtractedTransactionSchema = z.object({
  date: z.string().describe('The date of the transaction in YYYY-MM-DD format.'),
  description: z.string().describe('The description of the transaction.'),
  amount: z.number().describe('The transaction amount. Positive for income, negative for expenses.'),
  currency: z.string().optional().describe('The currency (e.g., USD, EUR, RON).'),
  bank: z.string().optional().describe('The bank name if specifically listed on this transaction row.'),
  category: z.string().describe('The category ID assigned to this transaction.'),
});

const ExtractTransactionsInputSchema = z.object({
  pdfDataUri: z.string().describe('Base64 encoded PDF data URI.'),
  categories: z.array(CategoryInfoSchema).describe('List of available categories to classify into.'),
});

export type ExtractTransactionsInput = z.infer<typeof ExtractTransactionsInputSchema>;

const ExtractTransactionsOutputSchema = z.object({
  bankName: z.string().optional().describe('The name of the bank issuing the statement.'),
  transactions: z.array(ExtractedTransactionSchema),
  pendingAmount: z.number().optional().describe('Total pending amount if found.'),
});

export type ExtractTransactionsOutput = z.infer<typeof ExtractTransactionsOutputSchema>;

export async function extractTransactions(
  input: ExtractTransactionsInput
): Promise<ExtractTransactionsOutput> {
  // console.log("DEBUG: Calling extractTransactionsFlow with input size:", input.pdfDataUri.length); // Too explicit, just checking existence
  try {
    return await extractTransactionsFlow(input);
  } catch (error: any) {
    console.error("DEBUG: Error in extractTransactions wrapper:", error);
    throw new Error(error.message || "Unknown error calling flow");
  }
}

// ... prompt definition restored ...
const extractTransactionsPrompt = ai.definePrompt({
  name: 'extractTransactionsPrompt',
  input: { schema: ExtractTransactionsInputSchema },
  output: { schema: ExtractTransactionsOutputSchema },
  prompt: `
    You are an expert data extractor and financial analyst. Process the provided bank statement PDF.

    **INPUT CONTEXT**
    You are provided with a list of valid categories:
    {{#each categories}}
    - ID: {{id}}, Name: {{name}}
    {{/each}}

    **TASK 1: FIND THE BANK NAME**
    - Look at the LOGO, HEADER, or FOOTER.
    - Extract the bank name (e.g., "Revolut", "Banca Transilvania", "ING").
    - Store in 'bankName'.

    **TASK 2: EXTRACT AND CATEGORIZE TRANSACTIONS**
    Extract every transaction row and assign it a category immediately.
    - date: YYYY-MM-DD.
    - description: Merchant name or details.
    - amount: Negative (-) for spending, Positive (+) for income.
    - currency: Extract the currency symbol (RON, $, €, £).
    - bank: Leave empty unless the transaction row *specifically* names a *different* bank.
    - category: Choose the BEST MATCH 'ID' from the provided list.
        - If description implies a transfer/sending money, use 'transfer' (if available).
        - If no clear match found, use 'uncategorized'.

    **TASK 3: PENDING**
    - Sum up any "Pending" transactions into 'pendingAmount'.

    Document:
    {{media url=pdfDataUri}}
  `,
});

const extractTransactionsFlow = ai.defineFlow(
  {
    name: 'extractTransactionsFlow',
    inputSchema: ExtractTransactionsInputSchema,
    outputSchema: ExtractTransactionsOutputSchema,
  },
  async (input) => {
    try {
      console.log('DEBUG: Starting extractTransactionsFlow');
      // console.log('DEBUG: Input Categories:', input.categories.map(c => c.name)); 

      const { output } = await extractTransactionsPrompt(input);

      console.log('DEBUG: Prompt completed. Output received:', !!output);

      // --- SANITIZATION STEP ---
      if (output && output.transactions) {
        output.transactions = output.transactions.map(t => {
          let cleanCurrency = t.currency || '$';

          if (cleanCurrency.length > 3) {
            cleanCurrency = cleanCurrency.split(/[\s,]+/)[0];
            if (cleanCurrency.length > 3) {
              cleanCurrency = cleanCurrency.substring(0, 3);
            }
          }

          return {
            ...t,
            currency: cleanCurrency
          };
        });
      }
      // -------------------------

      return output!;
    } catch (err: any) {
      console.error('DEBUG: extractTransactionsPrompt failed inside Flow:', err);
      // Log more details if available
      if (err.cause) console.error('DEBUG: Cause:', err.cause);
      if (err.stack) console.error('DEBUG: Stack:', err.stack);

      throw err;
    }
  }
);