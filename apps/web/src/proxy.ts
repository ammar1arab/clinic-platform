import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AUTH_COOKIE_NAME } from '@/constants/auth';
import { ROUTES } from '@/constants/routes';

/**
 * Next.js 16 Proxy (formerly `middleware`). Runs on the Node.js runtime before
 * routes render. This is a first-line UX gate only — real authorization still
 * happens per-request at the API and in the client dashboard layout.
 */

const PROTECTED_PREFIXES = [
  ROUTES.DASHBOARD,
  ROUTES.SCHEDULE,
  ROUTES.PATIENTS,
  ROUTES.SETTINGS,
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasToken = request.cookies.has(AUTH_COOKIE_NAME);

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  // Unauthenticated user hitting a protected route → send to login (remember where).
  if (isProtected && !hasToken) {
    const url = request.nextUrl.clone();
    url.pathname = ROUTES.LOGIN;
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  // Authenticated user hitting login or root → send straight to the dashboard.
  if (hasToken && (pathname === ROUTES.LOGIN || pathname === '/')) {
    const url = request.nextUrl.clone();
    url.pathname = ROUTES.DASHBOARD;
    url.search = '';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Run on everything except API routes, Next internals, and static assets (any path with a file extension).
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
