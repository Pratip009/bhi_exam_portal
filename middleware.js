import { NextResponse } from "next/server";
import { COOKIE, HOME, verifyToken } from "@/lib/jwt";

export async function middleware(req) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(COOKIE)?.value;
  const session = token ? await verifyToken(token) : null;

  if (pathname === "/" || pathname === "/login") {
    if (session && HOME[session.role]) return NextResponse.redirect(new URL(HOME[session.role], req.url));
    if (pathname === "/") return NextResponse.redirect(new URL("/login", req.url));
    return NextResponse.next();
  }

  if (!session) return NextResponse.redirect(new URL("/login", req.url));
  const area = pathname.split("/")[1];
  if (session.role !== area) return NextResponse.redirect(new URL(HOME[session.role] || "/login", req.url));
  return NextResponse.next();
}

export const config = { matcher: ["/", "/login", "/admin/:path*", "/teacher/:path*", "/student/:path*"] };
