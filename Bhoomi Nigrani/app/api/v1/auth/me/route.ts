import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { currentUser, auth } from "@clerk/nextjs/server";

export async function GET() {
  try {
    // 1. Try Clerk authentication
    try {
      const authObj = await auth();
      if (authObj?.userId) {
        const user = await currentUser();
        const email = user?.emailAddresses?.[0]?.emailAddress || "";
        const name =
          user?.fullName ||
          [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
          "Authorized Officer";
        const role = (user?.publicMetadata?.role as string) || "ADMIN";

        return NextResponse.json({
          success: true,
          data: {
            authenticated: true,
            userId: authObj.userId,
            email,
            name,
            role,
            scope: "NATIONAL",
          },
        });
      }
    } catch (clerkErr) {
      // Clerk auth unconfigured or non-clerk session
    }

    // 2. Fallback to legacy session cookie
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get("bhoomi_session");

    if (!sessionCookie?.value) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "Not authenticated" },
          data: { authenticated: false },
        },
        { status: 401 }
      );
    }

    // Decode session payload
    const sessionData = JSON.parse(
      Buffer.from(sessionCookie.value, "base64").toString("utf-8")
    );

    return NextResponse.json({
      success: true,
      data: {
        authenticated: true,
        userId: sessionData.userId,
        email: sessionData.email,
        name: sessionData.name || "Authorized Officer",
        role: sessionData.role || "ADMIN",
        scope: "NATIONAL",
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "INVALID_SESSION", message: "Invalid session token" },
        data: { authenticated: false },
      },
      { status: 401 }
    );
  }
}

