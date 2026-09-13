import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookieStore = cookies();
    cookieStore.delete("bhoomi_session");

    return NextResponse.json({
      success: true,
      message: "Successfully signed out of Bhoomi Sanket.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Logout error";
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message } },
      { status: 500 }
    );
  }
}
