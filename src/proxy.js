import { COOKIE_KEYS } from "@/constants/cookieKeys";
import { isJwtExpired } from "@/lib/jwtCookieUtils";
import { NextResponse } from "next/server";

const SITE_HOME_PAGE =
  process.env.NEXT_PUBLIC_SITE_URL || "https://lenaqar.com";

const IS_DEV = process.env.NODE_ENV === "development";

/**
 * DEV-ONLY observability for verifying the auth + refresh flow.
 * Logs each protected-route decision and tags the response with `x-mw-decision`
 * (`next` | `redirect`) so it can be read in DevTools. No-op in production.
 * Use `GET /api/auth/status?action=expire-access` to simulate an expired token,
 * then navigate to a protected route to watch the refresh bounce here.
 */
function withProxyDebug(response, request) {
  if (!IS_DEV) return response;
  const location = response?.headers?.get?.("location");
  try {
    response?.headers?.set?.("x-mw-decision", location ? "redirect" : "next");
  } catch {
    // rewrites may have immutable headers — ignore
  }
  return response;
}

// Admin route segments (without leading slash) that require authentication
const adminPaths = [
  'dashboard', 'campaigns', 'campaign-chat', 'schedule',
  'analytics', 'units', 'team', 'myProjects', 'developers', 'news', 'map', 'notifications',
  'market-index',
  'locations',
  'tools',
  'matching',
];

/**
 * Canonical unit detail is publicly shareable:
 *   /{clientId}/units/{code}  or  /units/{code}
 * List, edit, and pending-approval stay protected.
 */
function isPublicShareableUnitDetail(segments) {
  // /{clientId}/units/{code}  (not pending-approval, not …/edit)
  if (
    segments.length === 3 &&
    segments[1] === "units" &&
    segments[2] !== "pending-approval"
  ) {
    return true;
  }
  // bare /units/{code}
  if (
    segments.length === 2 &&
    segments[0] === "units" &&
    segments[1] !== "pending-approval"
  ) {
    return true;
  }
  return false;
}

function nextWithPathname(request, pathname) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-lena-pathname", pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export function proxy(request) {
  const { pathname } = request.nextUrl;

  if (pathname === "/lenaqar" || pathname === "/lenaqar/") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url, 308);
  }

  const segments = pathname.split("/").filter(Boolean);

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

  // Handle API image requests — restrict CORS to own domain only.
  if (pathname.startsWith('/api/images/') || pathname.startsWith('/images/')) {
    const response = NextResponse.next();
    const allowedOrigin = process.env.NEXT_PUBLIC_SITE_URL || "https://lenaqar.com";
    response.headers.set('Access-Control-Allow-Origin', allowedOrigin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Vary', 'Origin');
    return response;
  }

  const accessToken = request.cookies.get(COOKIE_KEYS.ACCESS_TOKEN)?.value;
  const refreshToken = request.cookies.get(COOKIE_KEYS.REFRESH_TOKEN)?.value;
  const cookieClientId = request.cookies.get(COOKIE_KEYS.CLIENT_ID)?.value;

  // Backward compat: /admin/* → /{clientId}/*
  if (segments[0] === 'admin') {
    const remainingPath = segments.slice(1).join('/');
    const dest = cookieClientId
      ? `/${cookieClientId}/${remainingPath}`
      : '/login';
    const redirectUrl = new URL(dest, request.url);
    redirectUrl.search = request.nextUrl.search;
    return withProxyDebug(NextResponse.redirect(redirectUrl), request);
  }

  // Backward compat: bare /{adminPath} → /{clientId}/{adminPath}
  // Exception: shareable unit detail stays public when anonymous (no login bounce).
  if (segments.length >= 1 && adminPaths.includes(segments[0])) {
    if (isPublicShareableUnitDetail(segments) && !refreshToken) {
      return withProxyDebug(nextWithPathname(request, pathname), request);
    }
    const dest = cookieClientId
      ? `/${cookieClientId}/${pathname.slice(1)}`
      : '/login';
    // Keep filter/query params when rewriting bare /units?… → /{clientId}/units?…
    const redirectUrl = new URL(dest, request.url);
    redirectUrl.search = request.nextUrl.search;
    return withProxyDebug(NextResponse.redirect(redirectUrl), request);
  }

  // Detect /{clientId}/{adminPath}[/*] as protected
  const isClientAdminRoute = segments.length >= 2 && adminPaths.includes(segments[1]);

  if (isClientAdminRoute) {
    // Shareable unit detail: allow anonymous (privacy_mode) without login redirect.
    if (isPublicShareableUnitDetail(segments) && !refreshToken) {
      return withProxyDebug(nextWithPathname(request, pathname), request);
    }

    // No refresh token: must log in again
    if (!refreshToken) {
      const response = NextResponse.redirect(new URL("/login", SITE_HOME_PAGE));
      response.cookies.delete(COOKIE_KEYS.ACCESS_TOKEN);
      response.cookies.delete(COOKIE_KEYS.REFRESH_TOKEN);
      response.cookies.delete(COOKIE_KEYS.CLIENT_ID);
      return withProxyDebug(response, request);
    }
    // Access token missing or JWT expired — refresh then continue
    const accessMissingOrExpired = !accessToken || isJwtExpired(accessToken);
    if (accessMissingOrExpired) {
      // A prior server-side refresh already hit a transient failure (network/backend
      // hiccup, not an invalid refresh token) for this navigation — don't loop through
      // another one. Let the page load and hand recovery to the client-side refresh.
      if (request.nextUrl.searchParams.get("authRetry") === "1") {
        return withProxyDebug(nextWithPathname(request, pathname), request);
      }
      const redirectParam = encodeURIComponent(
        request.nextUrl.pathname + request.nextUrl.search
      );
      return withProxyDebug(
        NextResponse.redirect(
          new URL(`/api/refresh-token?redirect=${redirectParam}`, SITE_HOME_PAGE)
        ),
        request
      );
    }
    // Authenticated protected route: allow through (logged in dev for visibility)
    return withProxyDebug(nextWithPathname(request, pathname), request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
