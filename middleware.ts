import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = [
  '/dashboard',
  '/incidencias',
  '/admin-incidencias',
  '/flota',
  '/analisis',
  '/usuarios',
  '/configuracion',
  '/inicio',
  '/mapa',
  '/reportar',
];

const publicRoutes = ['/auth/login', '/auth/register', '/'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authCookie = request.cookies.get('auth_token');

  const isProtected = protectedRoutes.some((route) =>
    pathname === route || pathname.startsWith(`${route}/`),
  );

  const isAuthPage = publicRoutes.some((route) =>
    pathname === route || pathname.startsWith(`${route}/`),
  );

  if (isProtected && !authCookie) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (authCookie && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
