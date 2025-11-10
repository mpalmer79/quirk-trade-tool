import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const isMockEnabled = process.env.NEXT_PUBLIC_ENABLE_MOCK === 'true';
  if (!isMockEnabled && req.nextUrl.pathname.startsWith('/mock')) {
    return NextResponse.redirect(new URL('/', req.url));
  }
}
export const config = { matcher: ['/mock/:path*', '/mock'] };
