import { NextResponse } from "next/server";

const protectedRoutes = ["/dashboard", "/units"];

export async function middleware(request) {
  const path = request.nextUrl.pathname;

  const isProtectedRoute = protectedRoutes.some((route) =>
    path.startsWith(route)
  );

  if (isProtectedRoute) {
    const clientId = request.cookies.get("client_id")?.value;

    if (!clientId) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  if (path === "/") {
    const clientId = request.cookies.get("client_id")?.value;
    if (clientId) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
