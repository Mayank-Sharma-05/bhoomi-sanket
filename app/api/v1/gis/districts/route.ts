import { NextResponse } from "next/server";
import { supabaseDb } from "@/lib/supabase/db";
import { mockStore } from "@/lib/data/mockStore";

export async function GET() {
  let features: any[] = [];
  try {
    features = await supabaseDb.getGisDistrictsFast();
  } catch (err) {
    console.warn("GIS districts DB error, falling back:", err);
  }

  if (!features || features.length === 0) {
    const projects = mockStore.getProjects();
    const districtMap = new Map<string, any>();
    for (const p of projects) {
      const key = `${p.district_name}-${p.state_code}`;
      if (!districtMap.has(key)) {
        districtMap.set(key, {
          district_id: p.district_id,
          district_name: p.district_name,
          state_code: p.state_code,
          total_projects: 0,
          total_cases: 0,
        });
      }
      const d = districtMap.get(key);
      d.total_projects++;
      d.total_cases += p.cases?.length || 0;
    }

    features = Array.from(districtMap.values()).map((d) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [78.0, 22.0],
      },
      properties: {
        district_id: d.district_id,
        district_name: d.district_name,
        state_code: d.state_code,
        total_projects: d.total_projects,
        total_cases: d.total_cases,
        avg_risk_probability: 0,
        critical_count: 0,
        highest_risk_tier: "LOW",
      },
    }));
  }

  return NextResponse.json({
    type: "FeatureCollection",
    features,
  });
}
