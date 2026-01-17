/* ============================================================
   FILE: middleware.ts

   SCOPE:
   Edge middleware session gate
   - Fix import: verifyEdgeSessionToken (was verifySessionTokenEdge)
   ============================================================ */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { verifyEdgeSessionToken } from "@/lib/authEdge";

const COOKIE_NAME = "pr_session";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname === "/"
  ) {
    return NextResponse.next();
  }

  const secret = process.env.SESSION_SECRET || "";
  if (!secret) {
    // If secret is missing, do not hard-block the whole app in middleware.
    // Let routes handle errors (avoids a blank site if env is misconfigured).
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE_NAME)?.value || "";
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  const session = await verifyEdgeSessionToken(token, secret);

  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
