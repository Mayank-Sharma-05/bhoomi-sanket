/**
 * Presentation-only synthetic heatmap visualization data — not database/ML data.
 *
 * 40 fixed deterministic points across India for heatmap presentation.
 * Distribution: 10 LOW, 10 MEDIUM, 10 HIGH, 10 CRITICAL.
 * These points are ONLY for frontend heatmap visualization.
 * Do NOT insert into Supabase. Do NOT use for analytics, rankings, alerts, or statistics.
 */

import { RiskLevel } from "@/shared/types/ml-contract";

export interface HeatmapPoint {
  state: string;
  district: string;
  latitude: number;
  longitude: number;
  intensity: number;
  riskTier: RiskLevel;
}

// Presentation-only synthetic heatmap visualization data — not database/ML data.
export const PRESENTATION_HEATMAP_POINTS: readonly HeatmapPoint[] = [
  // ── LOW RISK (0.10–0.30) — 10 points ─────────────────────────────────────
  { state: "Kerala",            district: "Ernakulam",       latitude: 9.9816,   longitude: 76.2999, intensity: 0.12, riskTier: "LOW" },
  { state: "Tamil Nadu",        district: "Coimbatore",      latitude: 11.0168,  longitude: 76.9558, intensity: 0.18, riskTier: "LOW" },
  { state: "Karnataka",         district: "Mysuru",          latitude: 12.2958,  longitude: 76.6394, intensity: 0.22, riskTier: "LOW" },
  { state: "Goa",               district: "North Goa",       latitude: 15.4909,  longitude: 73.8278, intensity: 0.15, riskTier: "LOW" },
  { state: "Himachal Pradesh",  district: "Shimla",          latitude: 31.1048,  longitude: 77.1734, intensity: 0.25, riskTier: "LOW" },
  { state: "Sikkim",            district: "East Sikkim",     latitude: 27.3389,  longitude: 88.6065, intensity: 0.20, riskTier: "LOW" },
  { state: "Punjab",            district: "Ludhiana",        latitude: 30.9010,  longitude: 75.8573, intensity: 0.28, riskTier: "LOW" },
  { state: "Uttarakhand",       district: "Dehradun",        latitude: 30.3165,  longitude: 78.0322, intensity: 0.14, riskTier: "LOW" },
  { state: "Meghalaya",         district: "East Khasi Hills",latitude: 25.5788,  longitude: 91.8933, intensity: 0.26, riskTier: "LOW" },
  { state: "Andhra Pradesh",    district: "Visakhapatnam",   latitude: 17.6868,  longitude: 83.2185, intensity: 0.19, riskTier: "LOW" },

  // ── MEDIUM RISK (0.31–0.55) — 10 points ──────────────────────────────────
  { state: "Maharashtra",       district: "Nagpur",          latitude: 21.1458,  longitude: 79.0882, intensity: 0.35, riskTier: "MEDIUM" },
  { state: "Gujarat",           district: "Surat",           latitude: 21.1702,  longitude: 72.8311, intensity: 0.42, riskTier: "MEDIUM" },
  { state: "Rajasthan",         district: "Jodhpur",         latitude: 26.2389,  longitude: 73.0243, intensity: 0.38, riskTier: "MEDIUM" },
  { state: "Madhya Pradesh",    district: "Indore",          latitude: 22.7196,  longitude: 75.8577, intensity: 0.50, riskTier: "MEDIUM" },
  { state: "West Bengal",       district: "Howrah",          latitude: 22.5958,  longitude: 88.2636, intensity: 0.44, riskTier: "MEDIUM" },
  { state: "Telangana",         district: "Warangal",        latitude: 17.9784,  longitude: 79.5941, intensity: 0.47, riskTier: "MEDIUM" },
  { state: "Odisha",            district: "Cuttack",         latitude: 20.4625,  longitude: 85.8830, intensity: 0.33, riskTier: "MEDIUM" },
  { state: "Haryana",           district: "Ambala",          latitude: 30.3782,  longitude: 76.7767, intensity: 0.52, riskTier: "MEDIUM" },
  { state: "Assam",             district: "Kamrup",          latitude: 26.1445,  longitude: 91.7362, intensity: 0.40, riskTier: "MEDIUM" },
  { state: "Chhattisgarh",      district: "Raipur",          latitude: 21.2514,  longitude: 81.6296, intensity: 0.55, riskTier: "MEDIUM" },

  // ── HIGH RISK (0.56–0.80) — 10 points ────────────────────────────────────
  { state: "Uttar Pradesh",     district: "Lucknow",         latitude: 26.8467,  longitude: 80.9462, intensity: 0.65, riskTier: "HIGH" },
  { state: "Bihar",             district: "Patna",           latitude: 25.6093,  longitude: 85.1376, intensity: 0.72, riskTier: "HIGH" },
  { state: "Jharkhand",         district: "Ranchi",          latitude: 23.3441,  longitude: 85.3096, intensity: 0.58, riskTier: "HIGH" },
  { state: "Maharashtra",       district: "Pune",            latitude: 18.5204,  longitude: 73.8567, intensity: 0.75, riskTier: "HIGH" },
  { state: "Tamil Nadu",        district: "Madurai",         latitude: 9.9252,   longitude: 78.1198, intensity: 0.68, riskTier: "HIGH" },
  { state: "Rajasthan",         district: "Jaipur",          latitude: 26.9124,  longitude: 75.7873, intensity: 0.62, riskTier: "HIGH" },
  { state: "Andhra Pradesh",    district: "Guntur",          latitude: 16.3067,  longitude: 80.4365, intensity: 0.77, riskTier: "HIGH" },
  { state: "Gujarat",           district: "Ahmedabad",       latitude: 23.0225,  longitude: 72.5714, intensity: 0.60, riskTier: "HIGH" },
  { state: "Manipur",           district: "Imphal West",     latitude: 24.8170,  longitude: 93.9368, intensity: 0.70, riskTier: "HIGH" },
  { state: "Madhya Pradesh",    district: "Bhopal",          latitude: 23.2599,  longitude: 77.4126, intensity: 0.78, riskTier: "HIGH" },

  // ── CRITICAL RISK (0.81–1.00) — 10 points ────────────────────────────────
  { state: "Delhi",             district: "New Delhi",       latitude: 28.6139,  longitude: 77.2090, intensity: 0.95, riskTier: "CRITICAL" },
  { state: "West Bengal",       district: "Kolkata",         latitude: 22.5726,  longitude: 88.3639, intensity: 0.88, riskTier: "CRITICAL" },
  { state: "Karnataka",         district: "Bengaluru Urban", latitude: 12.9716,  longitude: 77.5946, intensity: 0.92, riskTier: "CRITICAL" },
  { state: "Uttar Pradesh",     district: "Varanasi",        latitude: 25.3176,  longitude: 83.0064, intensity: 0.85, riskTier: "CRITICAL" },
  { state: "Kerala",            district: "Thiruvananthapuram", latitude: 8.5241, longitude: 76.9366, intensity: 0.90, riskTier: "CRITICAL" },
  { state: "Odisha",            district: "Ganjam",          latitude: 19.3860,  longitude: 84.9220, intensity: 0.87, riskTier: "CRITICAL" },
  { state: "Nagaland",          district: "Dimapur",         latitude: 25.7075,  longitude: 93.7273, intensity: 0.93, riskTier: "CRITICAL" },
  { state: "Jammu & Kashmir",   district: "Srinagar",        latitude: 34.0837,  longitude: 74.7973, intensity: 0.82, riskTier: "CRITICAL" },
  { state: "Tripura",           district: "West Tripura",    latitude: 23.8315,  longitude: 91.2868, intensity: 0.97, riskTier: "CRITICAL" },
  { state: "Maharashtra",       district: "Mumbai",          latitude: 19.0760,  longitude: 72.8777, intensity: 1.00, riskTier: "CRITICAL" },
] as const;
