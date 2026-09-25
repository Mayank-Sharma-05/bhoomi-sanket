import { NextResponse } from "next/server";
import { supabaseDb } from "@/lib/supabase/db";
import { mockStore } from "@/lib/data/mockStore";

export async function GET() {
  let features: any[] = [];
  try {
    features = await supabaseDb.getGisProjectsFast();
  } catch (err) {
    console.warn("GIS projects DB error, falling back:", err);
  }

  if (!features || features.length === 0) {
    const projects = mockStore.getProjects();
    features = projects.map((p) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [78.0, 22.0],
      },
      properties: {
        project_id: p.id,
        project_name: p.project_name,
        project_type: p.project_type,
        district_name: p.district_name,
        state_code: p.state_code,
        land_area_ha: p.land_area_ha || 0,
        budget_crore: p.budget_crore || 0,
        total_cases: p.cases?.length || 0,
        highest_risk_tier: "LOW",
      },
    }));
  }

  return NextResponse.json({
    type: "FeatureCollection",
    features,
  });
}
