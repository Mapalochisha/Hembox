import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Admin Protection
  if (pathname.startsWith("/admin")) {
    if (pathname.startsWith("/admin/login")) {
      if (token && (token.role === "SUPER_ADMIN" || token.role === "MANAGER" || token.role === "STAFF")) {
        return NextResponse.redirect(new URL("/admin/dashboard", req.url));
      }
      return NextResponse.next();
    }

    if (!token || !["SUPER_ADMIN", "MANAGER", "STAFF"].includes(token.role as string)) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }

  // Customer Account Protection
  if (pathname.startsWith("/account")) {
    // Exclude login and register pages
    if (pathname.startsWith("/account/login") || pathname.startsWith("/account/register")) {
      if (token && token.role === "CUSTOMER") {
        return NextResponse.redirect(new URL("/account", req.url));
      }
      return NextResponse.next();
    }

    if (!token || token.role !== "CUSTOMER") {
      const loginUrl = new URL("/account/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = { 
  matcher: [
    "/admin/:path*", 
    "/account/:path*"
  ] 
};
