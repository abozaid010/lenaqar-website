import { NextResponse } from "next/server";

export function proxy(request) {
  const { pathname } = request.nextUrl;

  if (pathname === "/lenaqar" || pathname === "/lenaqar/") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url, 308);
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

  // Handle API image requests — restrict CORS to own domain only.
  if (pathname.startsWith('/api/images/') || pathname.startsWith('/images/')) {
    const response = NextResponse.next();
    const allowedOrigin = process.env.NEXT_PUBLIC_SITE_URL || "https://lenaqar.com";
    response.headers.set('Access-Control-Allow-Origin', allowedOrigin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Vary', 'Origin');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
