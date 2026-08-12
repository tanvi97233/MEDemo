import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { readSession, SESSION_COOKIE } from "@/lib/session-token";

export async function proxy(request: NextRequest) {
  // Allow unauthenticated access during local development so the UI/menu
  // remains visible while working. Production still enforces session checks.
  if (process.env.NODE_ENV !== "production") return NextResponse.next();
  const path = request.nextUrl.pathname;
  const session = await readSession(request.cookies.get(SESSION_COOKIE)?.value);
  if (path === "/login")
    return session
      ? NextResponse.redirect(new URL("/", request.url))
      : NextResponse.next();
  if (!session) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", `${path}${request.nextUrl.search}`);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
