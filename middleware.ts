import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const protectedPages = ["/plan", "/dashboard", "/results", "/trip", "/admin"];
const protectedApi = ["/api/trips", "/api/generate", "/api/places", "/api/admin"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtectedPage = protectedPages.some((p) => pathname.startsWith(p));
  const isProtectedApi = protectedApi.some((p) => pathname.startsWith(p));

  if (!isProtectedPage && !isProtectedApi) {
    return NextResponse.next();
  }

  const token = await getToken({ req: request });

  if (!token) {
    if (isProtectedApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin route protection: check isAdmin on JWT token
  const isAdminRoute = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  if (isAdminRoute && !token.isAdmin) {
    if (pathname.startsWith("/api/admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

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
