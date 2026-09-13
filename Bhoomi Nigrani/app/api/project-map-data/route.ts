import { NextRequest, NextResponse } from "next/server";
import { callMLService } from "@/lib/ml/mlProxy";

export async function GET(req: NextRequest) {
  try {
    const response = await callMLService<any>("/project-map-data", "GET");
    return NextResponse.json({ success: true, data: response, source: "ml-service" });
  } catch (err: unknown) {
    console.error("project-map-data route error:", err);
    return NextResponse.json(
      { success: false, error: { code: "GIS_DATA_FAILED", message: err instanceof Error ? err.message : "Unable to load project map data" } },
      { status: 502 }
    );
  }
}
