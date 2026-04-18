import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('obraya_token')?.value;
  const { pathname } = request.nextUrl;

  // Rutas públicas
  const publicPaths = ['/login', '/signup', '/'];
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

  if (isPublicPath) {
    return NextResponse.next();
  }

  // Verificar token para rutas protegidas
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};