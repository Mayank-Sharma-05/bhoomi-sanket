import fs from "fs";

if (fs.existsSync(".env.local")) {
  const envContent = fs.readFileSync(".env.local", "utf-8");
  envContent.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("DATABASE_URL=")) {
      process.env.DATABASE_URL = trimmed.split("=")[1].replace(/^["']|["']$/g, "");
    }
  });
}

import { supabaseDb } from "../../lib/supabase/db";

async function testGis() {
  console.log("=== Testing GIS Fast Endpoints & Coordinates ===");

  const projects = await supabaseDb.getGisProjectsFast();
  console.log(`Loaded ${projects.length} GIS project features.`);

  const unassessedProjects = projects.filter((p) => p.properties.highest_risk_tier === "UNAVAILABLE");
  const assessedProjects = projects.filter((p) => p.properties.highest_risk_tier !== "UNAVAILABLE");
  console.log(` - Assessed Projects (ML-Supported): ${assessedProjects.length}`);
  console.log(` - Unassessed Projects (GIS-Only): ${unassessedProjects.length}`);

  // Sample check coordinates
  const sampleAssessed = assessedProjects[0];
  const sampleUnassessed = unassessedProjects[0];

  console.log("\nSample Assessed Project:", {
    name: sampleAssessed.properties.project_name,
    district: sampleAssessed.properties.district_name,
    state: sampleAssessed.properties.state_code,
    tier: sampleAssessed.properties.highest_risk_tier,
    coordinates: sampleAssessed.geometry.coordinates,
  });

  console.log("\nSample Unassessed Project:", {
    name: sampleUnassessed.properties.project_name,
    district: sampleUnassessed.properties.district_name,
    state: sampleUnassessed.properties.state_code,
    tier: sampleUnassessed.properties.highest_risk_tier,
    coordinates: sampleUnassessed.geometry.coordinates,
  });

  // Verify none are [78.0, 22.0]
  const hardcodedCoords = projects.filter(
    (p) => p.geometry.coordinates[0] === 78.0 && p.geometry.coordinates[1] === 22.0
  );
  console.log(`\nProjects with legacy hardcoded [78, 22] coordinates: ${hardcodedCoords.length} (Expected: 0)`);

  const districts = await supabaseDb.getGisDistrictsFast();
  console.log(`\nLoaded ${districts.length} GIS district features.`);
  const unassessedDistricts = districts.filter((d) => d.properties.highest_risk_tier === "UNAVAILABLE");
  const assessedDistricts = districts.filter((d) => d.properties.highest_risk_tier !== "UNAVAILABLE");
  console.log(` - Assessed Districts (ML-Supported): ${assessedDistricts.length}`);
  console.log(` - Unassessed Districts (GIS-Only): ${unassessedDistricts.length}`);

  console.log("\nSample GIS District (Unassessed):", {
    district: unassessedDistricts[0]?.properties.district_name,
    state: unassessedDistricts[0]?.properties.state_code,
    tier: unassessedDistricts[0]?.properties.highest_risk_tier,
    avg_risk: unassessedDistricts[0]?.properties.avg_risk_probability,
    coordinates: unassessedDistricts[0]?.geometry.coordinates,
  });

  console.log("\nSample ML District (Assessed):", {
    district: assessedDistricts[0]?.properties.district_name,
    state: assessedDistricts[0]?.properties.state_code,
    tier: assessedDistricts[0]?.properties.highest_risk_tier,
    avg_risk: assessedDistricts[0]?.properties.avg_risk_probability,
    coordinates: assessedDistricts[0]?.geometry.coordinates,
  });

  process.exit(0);
}

testGis().catch((err) => {
  console.error("Test GIS failed:", err);
  process.exit(1);
});
