import { NextRequest, NextResponse } from "next/server";
import { mockStore } from "@/lib/data/mockStore";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const unreadOnly = searchParams.get("unread_only") === "true";

  let alerts = await mockStore.getAlertsAsync();
  if (unreadOnly) {
    alerts = alerts.filter((a) => !a.acknowledged);
  }

  return NextResponse.json({
    success: true,
    data: alerts,
    meta: {
      total: alerts.length,
      unacknowledged: alerts.filter((a) => !a.acknowledged).length,
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const { alert_id } = await request.json();
    if (!alert_id) {
      return NextResponse.json(
        { success: false, error: { code: "MISSING_ID", message: "alert_id is required" } },
        { status: 400 }
      );
    }

    const updated = mockStore.acknowledgeAlert(alert_id);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Alert not found" } },
        { status: 404 }
      );
    }

    mockStore.addAuditLog({
      id: `log-${Date.now()}`,
      user_id: "usr-officer-01",
      user_name: "Authorized Officer",
      action: "ACKNOWLEDGE_ALERT",
      entity_type: "alert",
      entity_id: alert_id,
      details: `Acknowledged alert: ${updated.title}`,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "ERROR",
          message: err instanceof Error ? err.message : "Failed to acknowledge alert",
        },
      },
      { status: 400 }
    );
  }
}
