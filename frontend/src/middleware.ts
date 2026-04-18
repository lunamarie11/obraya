import { NextRequest, NextResponse } from "next/server";

const PROTECTED = ["/arquitecto", "/comercio", "/buyer", "/delivery"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const token = req.cookies.get("obraya_token")?.value;
  if (!token) {
    const login = new URL("/login", req.url);
    login.searchParams.set("redirect", pathname);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/arquitecto/:path*", "/comercio/:path*", "/buyer/:path*", "/delivery/:path*"],
};
