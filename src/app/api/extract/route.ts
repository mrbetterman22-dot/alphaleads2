import { NextRequest, NextResponse } from 'next/server';
import { extractTransactions } from '@/ai/flows/extract-transactions';

export async function POST(req: NextRequest) {
  try {
    const { pdfDataUri, categories } = await req.json();

    if (!pdfDataUri || !categories) {
      return NextResponse.json({ message: 'Missing pdfDataUri or categories' }, { status: 400 });
    }

    const output = await extractTransactions({ pdfDataUri, categories });

    return NextResponse.json(output);
  } catch (error: any) {
    console.error('Error in /api/extract:', error);
    return NextResponse.json({ message: error.message || 'An unexpected error occurred' }, { status: 500 });
  }
}
