import { COOKIE_KEYS } from "@/constants/cookieKeys";
import { NextResponse } from "next/server";

const protectedRoutes = [
  "/dashboard",
  "/campaigns",
  "/units",
  "/team",
  "/analytics",
  "/schedule",
  "/myProjects",
  "/developers",
];

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Handle image requests with proper MIME types
  if (pathname.match(/\.(jpg|jpeg|png|gif|webp|avif|svg)$/i)) {
    const response = NextResponse.next();

    // Set proper cache headers for images
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');

    // Set proper MIME types for images
    if (pathname.match(/\.(jpg|jpeg)$/i)) {
      response.headers.set('Content-Type', 'image/jpeg');
    } else if (pathname.match(/\.png$/i)) {
      response.headers.set('Content-Type', 'image/png');
    } else if (pathname.match(/\.gif$/i)) {
      response.headers.set('Content-Type', 'image/gif');
    } else if (pathname.match(/\.webp$/i)) {
      response.headers.set('Content-Type', 'image/webp');
    } else if (pathname.match(/\.avif$/i)) {
      response.headers.set('Content-Type', 'image/avif');
    } else if (pathname.match(/\.svg$/i)) {
      response.headers.set('Content-Type', 'image/svg+xml');
    }

    return response;
  }

  // Handle API image requests
  if (pathname.startsWith('/api/images/') || pathname.startsWith('/images/')) {
    const response = NextResponse.next();

    // Set CORS headers for image API requests
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');

    return response;
  }

  // Get cookies from request headers
  const accessToken = request.cookies.get(COOKIE_KEYS.ACCESS_TOKEN)?.value;
  const refreshToken = request.cookies.get(COOKIE_KEYS.REFRESH_TOKEN)?.value;

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    // No refresh token: must log in again
    if (!refreshToken) {
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete(COOKIE_KEYS.ACCESS_TOKEN);
      response.cookies.delete(COOKIE_KEYS.REFRESH_TOKEN);
      response.cookies.delete(COOKIE_KEYS.CLIENT_ID);
      return response;
    }
    // Access token missing but refresh token present: refresh then continue (keep user logged in up to 10 days)
    if (!accessToken) {
      const redirectParam = encodeURIComponent(
        request.nextUrl.pathname + request.nextUrl.search
      );
      return NextResponse.redirect(
        new URL(`/api/refresh-token?redirect=${redirectParam}`, request.url)
      );
    }
  }

  if (pathname === "/" && accessToken) {
    console.log("Redirecting to dashboard");
    return NextResponse.redirect(new URL("/dashboard", request.url));
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
