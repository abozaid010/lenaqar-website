import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// تحمي فقط /dashboard و /units (بدون أي شيء بعدها)
const exactProtectedRoutes = ["/dashboard", "/units"];

export async function middleware(request) {
  const path = request.nextUrl.pathname;

  // تحقق من التطابق التام مع المسارات المحمية فقط
  const isProtectedRoute = exactProtectedRoutes.includes(path);

  if (isProtectedRoute) {
    const clientId = request.cookies.get("client_id")?.value;

    if (!clientId) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
