import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  getAdminSessionCookieName,
  verifyAdminSession,
} from "@/lib/admin-auth";

export async function proxy(
  request: NextRequest
) {
  const pathname = request.nextUrl.pathname;

  if (pathname === "/admin/login") {
    const token = request.cookies.get(
      getAdminSessionCookieName()
    )?.value;

    if (await verifyAdminSession(token)) {
      return NextResponse.redirect(
        new URL("/admin/orders", request.url)
      );
    }

    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    const token = request.cookies.get(
      getAdminSessionCookieName()
    )?.value;

    const valid =
      await verifyAdminSession(token);

    if (!valid) {
      const loginUrl = new URL(
        "/admin/login",
        request.url
      );

      loginUrl.searchParams.set(
        "next",
        pathname
      );

      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};