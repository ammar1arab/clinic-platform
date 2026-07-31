import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AUTH_COOKIE_NAME } from '@/constants/auth';
import { ROUTES } from '@/constants/routes';

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

  if (isProtected && !hasToken) {
    const url = request.nextUrl.clone();
    url.pathname = ROUTES.LOGIN;
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  if (hasToken && (pathname === ROUTES.LOGIN || pathname === '/')) {
    const url = request.nextUrl.clone();
    url.pathname = ROUTES.DASHBOARD;
    url.search = '';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
