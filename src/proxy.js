import { COOKIE_KEYS } from "@/constants/cookieKeys";
import { NextResponse } from "next/server";

const SITE_HOME_PAGE =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.lenaai.net";

// Admin route segments (without leading slash) that require authentication
const adminPaths = [
  'dashboard', 'campaigns', 'campaign-chat', 'schedule',
  'analytics', 'units', 'team', 'myProjects', 'developers', 'news', 'map',
];

export function proxy(request) {
  const { pathname } = request.nextUrl;

  // Subdomain: contact.lenaai.net → serve /contact (CEO digital business card)
  const host = request.headers.get("host") || "";
  if (host === "contact.lenaai.net") {
    return NextResponse.rewrite(new URL("/contact", request.url));
  }

  // Handle image requests with proper MIME types
  if (pathname.match(/\.(jpg|jpeg|png|gif|webp|avif|svg)$/i)) {
    const response = NextResponse.next();
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
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
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    return response;
  }

  const accessToken = request.cookies.get(COOKIE_KEYS.ACCESS_TOKEN)?.value;
  const refreshToken = request.cookies.get(COOKIE_KEYS.REFRESH_TOKEN)?.value;
  const cookieClientId = request.cookies.get(COOKIE_KEYS.CLIENT_ID)?.value;

  const segments = pathname.split('/').filter(Boolean);
  // segments[0] = clientId, segments[1] = adminPath

  // Backward compat: /admin/* → /{clientId}/*
  if (segments[0] === 'admin') {
    const remainingPath = segments.slice(1).join('/');
    const dest = cookieClientId
      ? `/${cookieClientId}/${remainingPath}`
      : '/login';
    return NextResponse.redirect(new URL(dest, SITE_HOME_PAGE));
  }

  // Backward compat: bare /{adminPath} → /{clientId}/{adminPath}
  if (segments.length >= 1 && adminPaths.includes(segments[0])) {
    const dest = cookieClientId
      ? `/${cookieClientId}/${pathname.slice(1)}`
      : '/login';
    return NextResponse.redirect(new URL(dest, SITE_HOME_PAGE));
  }

  // Detect /{clientId}/{adminPath}[/*] as protected
  const isClientAdminRoute = segments.length >= 2 && adminPaths.includes(segments[1]);

  if (isClientAdminRoute) {
    // No refresh token: must log in again
    if (!refreshToken) {
      const response = NextResponse.redirect(new URL("/login", SITE_HOME_PAGE));
      response.cookies.delete(COOKIE_KEYS.ACCESS_TOKEN);
      response.cookies.delete(COOKIE_KEYS.REFRESH_TOKEN);
      response.cookies.delete(COOKIE_KEYS.CLIENT_ID);
      return response;
    }
    // Access token missing but refresh token present: refresh then continue
    if (!accessToken) {
      const redirectParam = encodeURIComponent(
        request.nextUrl.pathname + request.nextUrl.search
      );
      return NextResponse.redirect(
        new URL(`/api/refresh-token?redirect=${redirectParam}`, SITE_HOME_PAGE)
      );
    }
  }

  // Home page: redirect logged-in user to their dashboard
  if (pathname === "/" && accessToken && cookieClientId) {
    return NextResponse.redirect(
      new URL(`/${cookieClientId}/dashboard`, SITE_HOME_PAGE)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
