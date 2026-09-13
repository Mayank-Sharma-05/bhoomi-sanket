import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/login(.*)",
  "/sign-up(.*)",
  "/api/v1/auth/(.*)",
  "/api/v1/cron/(.*)",
  "/bhoomi-(.*)",
]);

const isProtectedApi = createRouteMatcher([
  "/api/v1/projects(.*)",
  "/api/v1/cases(.*)",
  "/api/v1/gis(.*)",
  "/api/v1/analytics(.*)",
  "/api/v1/alerts(.*)",
  "/api/v1/admin(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;
  const authObj = await auth();

  const legacySession = req.cookies.get("bhoomi_session");
  const isAuthenticated = !!authObj.userId || !!legacySession?.value;

  // Root redirect
  if (pathname === "/") {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    } else {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // Redirect to dashboard if already authenticated and trying to access /login
  if (pathname === "/login" && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Allow public routes
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // Protect APIs with 401 JSON
  if (isProtectedApi(req) && !isAuthenticated) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required to access Bhoomi Sanket secure APIs.",
        },
      },
      { status: 401 }
    );
  }

  // Protect all other application routes
  if (!isAuthenticated) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};

