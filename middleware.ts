import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

type Role = 'ADMIN' | 'CITIZEN' | 'DRIVER';

interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
}

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET no configurado');
  }
  return new TextEncoder().encode(secret);
}

async function verifyJwt(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: ['HS256'],
    });
    return payload as unknown as JwtPayload;
  } catch {
    return null;
  }
}

const roleRoutes: Record<string, Role> = {
  '/dashboard': 'ADMIN',
  '/admin-incidencias': 'ADMIN',
  '/flota': 'ADMIN',
  '/analisis': 'ADMIN',
  '/usuarios': 'ADMIN',
  '/configuracion': 'ADMIN',
  '/admin-rutas': 'ADMIN',
  '/admin-zonas': 'ADMIN',
  '/admin-residuos': 'ADMIN',
  '/conductor': 'DRIVER',
  '/inicio': 'CITIZEN',
  '/incidencias': 'CITIZEN',
  '/mapa': 'CITIZEN',
  '/reportar': 'CITIZEN',
  '/puntos-recojo': 'CITIZEN',
  '/residuos': 'CITIZEN',
  '/recoleccion': 'CITIZEN',
  '/perfil': 'CITIZEN',
};

const roleHome: Record<Role, string> = {
  ADMIN: '/dashboard',
  CITIZEN: '/inicio',
  DRIVER: '/conductor/dashboard',
};

const publicRoutes = ['/auth/login', '/auth/register', '/api/auth', '/'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authCookie = request.cookies.get('auth_token');
  const token = authCookie?.value;

  const payload = token ? await verifyJwt(token) : null;
  const role = payload?.role;

  const isPublic = publicRoutes.some((route) =>
    pathname === route || pathname.startsWith(`${route}/`),
  );

  const isProtected = Object.keys(roleRoutes).some((route) =>
    pathname === route || pathname.startsWith(`${route}/`),
  );

  // Don't redirect authenticated users on API routes (e.g. logout)
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Redirect authenticated users on public routes to their home
  if (isPublic && role) {
    return NextResponse.redirect(new URL(roleHome[role], request.url));
  }

  // Redirect unauthenticated users on protected routes to login
  if (isProtected && !role) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check role-based access
  if (isProtected && role) {
    const requiredRole = Object.entries(roleRoutes).find(([route]) =>
      pathname === route || pathname.startsWith(`${route}/`),
    )?.[1];

    if (requiredRole && role !== requiredRole) {
      return NextResponse.redirect(new URL(roleHome[role], request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
