import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

const SIGNIN_PATH = "/signin";
const ADMIN_SIGNIN_PATH = "/admin/login";

function safeCallbackUrl(value: string): string {
  if (value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\")) {
    return value;
  }
  return "/account";
}

function redirectToSignIn(request: NextRequest, fallback: string): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = SIGNIN_PATH;
  url.search = "";
  url.searchParams.set("callbackUrl", safeCallbackUrl(fallback));
  return NextResponse.redirect(url);
}

function redirectToAdminSignIn(request: NextRequest, fallback: string): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = ADMIN_SIGNIN_PATH;
  url.search = "";
  url.searchParams.set("callbackUrl", safeCallbackUrl(fallback));
  return NextResponse.redirect(url);
}

function allow(request: NextRequest): NextResponse {
  const headers = new Headers(request.headers);
  headers.set("x-pathname", request.nextUrl.pathname);
  return NextResponse.next({ request: { headers } });
}

// Route protection sits in the proxy AND is re-verified inside every server
// action/page, per Next 16 guidance — never rely on this layer alone.
export const proxy = auth((request) => {
  const { pathname } = request.nextUrl;
  const user = request.auth?.user;

  // The admin login page is public: signed-in admins are sent straight to the
  // admin area, while customers (signed in or not) may still view it so they can
  // switch to an administrator session.
  if (pathname === ADMIN_SIGNIN_PATH) {
    if (user?.role === "ADMIN") {
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      url.search = "";
      return NextResponse.redirect(url);
    }
    return allow(request);
  }

  if (pathname.startsWith("/account") && !user?.id) {
    return redirectToSignIn(request, pathname + request.nextUrl.search);
  }

  if (pathname.startsWith("/admin")) {
    if (!user?.id) return redirectToAdminSignIn(request, pathname);
    if (user.role !== "ADMIN") {
      const url = request.nextUrl.clone();
      url.pathname = "/account";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return allow(request);
});

export const config = {
  matcher: ["/account/:path*", "/admin/:path*"],
};