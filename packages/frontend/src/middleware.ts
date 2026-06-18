import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/register', '/superadmin'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rutas públicas siempre permitidas
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    // Bloquear acceso a /superadmin/dashboard sin rol SuperAdmin
    if (pathname.startsWith('/superadmin/') || pathname === '/superadmin') {
      // La página de login /superadmin es pública; el dashboard requiere rol
      if (pathname !== '/superadmin') {
        const role = request.cookies.get('userRole')?.value;
        if (role !== 'SuperAdmin') {
          return NextResponse.redirect(new URL('/superadmin', request.url));
        }
      }
    }
    return NextResponse.next();
  }

  // Todas las demás rutas requieren token
  const token = request.cookies.get('accessToken')?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Evitar que usuarios normales accedan a rutas de superadmin
  if (pathname.startsWith('/superadmin')) {
    const role = request.cookies.get('userRole')?.value;
    if (role !== 'SuperAdmin') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
