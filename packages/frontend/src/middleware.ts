import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rutas completamente públicas — marketplace buyer-facing
const PUBLIC_PREFIXES = [
  '/',
  '/marketplace',
  '/cart',
  '/checkout',
  '/order-confirmation',
  '/login',
  '/register',
  '/accept-invite',
  '/terminos',
  '/privacidad',
];

// Rutas que solo puede ver SuperAdmin
const SUPERADMIN_PREFIXES = ['/superadmin/dashboard', '/superadmin/companies', '/superadmin/users', '/superadmin/orders', '/superadmin/products', '/superadmin/monitoring'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rutas públicas — buyer experience + auth pages
  const isPublic = PUBLIC_PREFIXES.some(
    (p) => pathname === p || (p !== '/' && pathname.startsWith(p + '/')) || (p !== '/' && pathname === p),
  ) || pathname === '/';

  if (isPublic) {
    // /superadmin protegido dentro de las públicas
    if (pathname.startsWith('/superadmin/')) {
      const role = request.cookies.get('userRole')?.value;
      if (role !== 'SuperAdmin') {
        return NextResponse.redirect(new URL('/superadmin', request.url));
      }
    }
    return NextResponse.next();
  }

  // Rutas del backoffice — requieren token
  const token = request.cookies.get('accessToken')?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Superadmin routes — requieren rol SuperAdmin
  const isSuperAdminRoute = SUPERADMIN_PREFIXES.some((p) => pathname.startsWith(p));
  if (isSuperAdminRoute) {
    const role = request.cookies.get('userRole')?.value;
    if (role !== 'SuperAdmin') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  // El negative lookahead excluye además cualquier ruta con extensión de
  // archivo (ícono, SVG, manifest, etc. servidos desde /public o desde las
  // convenciones de metadata de Next) — si no, el middleware las intercepta
  // y las redirige a /login por no tener token (bug real: rompía favicon.ico,
  // icon.png, apple-icon.png y /brand/obraya-lockup.svg en producción).
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api|.*\\..*).*)'],
};
