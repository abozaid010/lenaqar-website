import { NextResponse } from "next/server";

const protectedRoutes = ["/dashboard", "/units", "/team", "/client"];

export async function middleware(request, response) {
  const path = request.nextUrl.pathname;

  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;

  const isProtectedRoute = protectedRoutes.some((route) =>
    path.startsWith(route)
  );

  if (isProtectedRoute) {
    if (!accessToken || !refreshToken) {
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("access_token");
      response.cookies.delete("refresh_token");
      response.cookies.delete("lena-website-client_id");
      return response;
    }
  }

  if (path === "/") {
    if (accessToken) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
