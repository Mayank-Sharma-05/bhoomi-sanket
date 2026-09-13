import { NextResponse } from "next/server";
import { mockStore } from "@/lib/data/mockStore";

export async function GET() {
  const summary = await mockStore.getDashboardSummaryAsync();

  return NextResponse.json({
    success: true,
    data: summary,
  });
}
