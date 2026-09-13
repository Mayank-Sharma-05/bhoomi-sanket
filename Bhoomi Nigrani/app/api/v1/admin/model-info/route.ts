import { NextResponse } from "next/server";
import { getModelInfo, checkMLServiceHealth } from "@/lib/ml/mlClient";

export async function GET() {
  const [info, health] = await Promise.all([getModelInfo(), checkMLServiceHealth()]);

  if (!health || !info) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "ML_SERVICE_OFFLINE",
          message: "The Python model service is offline or unavailable; the app must not return a repository stub object.",
        },
      },
      { status: 503 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      health,
      model_info: info,
    },
  });
}
