import { NextResponse } from "next/server";
import { supabaseDb } from "@/lib/supabase/db";

export async function GET() {
  const features = await supabaseDb.getGisDistrictsFast();

  return NextResponse.json({
    type: "FeatureCollection",
    features,
  });
}
