import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Route-level gate for the admin panel (FIND-01).
 *
 * The server components and API handlers under /admin already enforce
 * fine-grained RBAC via requireRole (including AdminProfile status). This proxy
 * adds the missing edge-level redirect so unauthenticated visitors never reach
 * the admin shell at all, instead of receiving an in-page error with HTTP 200.
 *
 * The role/status authority remains server-side: this only redirects clearly
 * unauthenticated requests to sign-in and clearly non-admin customers home.
 * Anything else passes through to the server-side checks, so an admin is never
 * locked out by a stale or partial token claim.
 *
 * Next.js 16 renamed the `middleware` file convention to `proxy`.
 */
const CUSTOMER_ROLE = "CUSTOMER";

export async function proxy(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set(
      "callbackUrl",
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    );

    return NextResponse.redirect(signInUrl);
  }

  if (token.role === CUSTOMER_ROLE) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
