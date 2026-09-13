import { NextResponse } from "next/server";
import { mockStore } from "@/lib/data/mockStore";

export async function GET() {
  const logs = await mockStore.getAuditLogsAsync();
  return NextResponse.json({
    success: true,
    data: logs,
    meta: {
      total: logs.length,
      immutable: true,
    },
  });
}
