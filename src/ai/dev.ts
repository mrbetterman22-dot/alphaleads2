import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-spending.ts';
import '@/ai/flows/categorize-transactions.ts';
import '@/ai/flows/extract-transactions.ts';
