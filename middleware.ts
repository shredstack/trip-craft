import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

const protectedPages = ["/plan", "/dashboard", "/results", "/trip", "/admin"];
const protectedApi = ["/api/trips", "/api/generate", "/api/places", "/api/admin"];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  const isProtectedPage = protectedPages.some((p) => pathname.startsWith(p));
  const isProtectedApi = protectedApi.some((p) => pathname.startsWith(p));

  if (!isProtectedPage && !isProtectedApi) {
    return NextResponse.next();
  }

  if (!req.auth) {
    if (isProtectedApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin route protection
  const isAdminRoute = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  if (isAdminRoute && !req.auth.user?.isAdmin) {
    if (pathname.startsWith("/api/admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/plan/:path*",
    "/dashboard/:path*",
    "/results/:path*",
    "/trip/:path*",
    "/admin/:path*",
    "/api/trips/:path*",
    "/api/generate/:path*",
    "/api/places/:path*",
    "/api/admin/:path*",
  ],
};
