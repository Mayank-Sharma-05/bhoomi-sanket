import { NextRequest, NextResponse } from "next/server";
import { mockStore } from "@/lib/data/mockStore";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const resolvedParams = await Promise.resolve(params);
  const projectId = decodeURIComponent(resolvedParams?.id || "").trim();
  const project = await mockStore.getProjectByIdAsync(projectId);

  if (!project) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "NOT_FOUND",
          message: `Project with ID ${params.id} not found.`,
        },
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: project,
  });
}
