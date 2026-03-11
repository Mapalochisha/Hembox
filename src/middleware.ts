export const dynamic = "force-dynamic";
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;
    if (pathname === "/admin/login" && token) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized({ req, token }) {
        const { pathname } = req.nextUrl;
        if (pathname.startsWith("/admin/login")) return true;
        if (pathname.startsWith("/admin")) return !!token;
        return true;
      },
    },
    pages: {
      signIn: "/admin/login",
    },
  }
);

export const config = { matcher: ["/admin/:path*"] };
