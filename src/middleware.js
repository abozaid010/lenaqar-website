import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function middleware(request) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname;

  // Protect dashboard routes
  if (path.startsWith("/dashboard")) {
    // Check for client_id cookie
    const clientId = request.cookies.get("client_id")?.value;

    // If no client_id, redirect to login with a message
    if (!clientId) {
      return NextResponse.redirect(
        new URL("/login", request.url)
      );
    }
  }

  // Continue with the request for all other paths
  return NextResponse.next();
}

// Configure which paths this middleware will run on
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
