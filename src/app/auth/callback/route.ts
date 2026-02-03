import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/dashboard';

  if (code) {
    const cookieStore = await cookies();
    
    // A TypeScript hibát elnémítjuk, mert a könyvtár típusa még nem frissült Next.js 15-höz,
    // de a működés így helyes (átadjuk a már betöltött cookieStore-t).
    // @ts-ignore
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(`${requestUrl.origin}${next}`);
}