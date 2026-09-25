import { z } from "zod";

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:8000";
const REQUEST_TIMEOUT_MS = Number(process.env.ML_SERVICE_TIMEOUT_MS || 5000);
const ML_SERVICE_TOKEN = process.env.ML_SERVICE_SECRET || "dev-secret-local-only";

export type ServiceJson = Record<string, unknown> | unknown[] | null;

export async function callMLService<T = ServiceJson>(
  path: string,
  method: "GET" | "POST" = "GET",
  body?: unknown
): Promise<T> {
  const attempts = Number(process.env.ML_SERVICE_RETRIES || 2);
  let lastError: unknown;

  for (let attempt = 0; attempt <= attempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const headers: Record<string, string> = {
        Accept: "application/json",
        "X-Internal-Token": ML_SERVICE_TOKEN,
      };

      if (method === "POST" && body) {
        headers["Content-Type"] = "application/json";
      }

      const res = await fetch(`${ML_SERVICE_URL}${path}`, {
        method,
        signal: controller.signal,
        headers,
        body: method === "POST" ? JSON.stringify(body) : undefined,
        cache: "no-store",
      });

      clearTimeout(timeout);

      if (!res.ok) {
        const text = await res.text();
        let payload: unknown = text || "ML service error";
        try {
          const json = text ? JSON.parse(text) : null;
          payload = json?.detail || json?.message || text || "ML service error";
        } catch {
          // Proxies and load balancers can return non-JSON error bodies.
        }
        const detail = typeof payload === "string" ? payload : JSON.stringify(payload);
        throw new Error(`ML service ${path} failed (${res.status}): ${detail}`);
      }

      return (await res.json()) as T;
    } catch (err) {
      lastError = err;
      clearTimeout(timeout);
      if (attempt < attempts) {
        continue;
      }
      throw err;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Failed to call ML service");
}

export const predictionFeatureSchema = z.object({
  case_id: z.string().min(1),
  schema_version: z.literal("v1").default("v1"),
  trigger: z.enum(["CASE_UPDATE", "BATCH_REFRESH", "MANUAL"]).default("MANUAL"),
  requested_at: z.string().datetime().optional(),
  features: z.object({
    project_type: z.string().min(1),
    funding_model: z.string().min(1),
    land_area_ha: z.number().optional(),
    num_affected_families: z.number().optional(),
    budget_crore_bucket: z.string().min(1),
    state_code: z.string().min(1),
    district_id: z.number().optional(),
    current_stage: z.string().min(1),
    days_at_current_stage: z.number().optional(),
    stage_deadline_ratio: z.number().optional(),
    milestone_completion_rate: z.number().optional(),
    legal_cases_pending: z.number().optional(),
    court_stay_active: z.number().optional(),
    avg_dispute_age_days: z.number().optional(),
    comp_disbursement_ratio: z.number().optional(),
    comp_disputes_pending: z.number().optional(),
    max_pending_days_comp: z.number().optional(),
    rr_plan_approved: z.number().optional(),
    resettlement_ratio: z.number().optional(),
    clear_title_percent: z.number().optional(),
    forest_land_involved: z.number().optional(),
    tribal_area: z.number().optional(),
    district_historical_delay_rate: z.number().optional(),
    public_hearing_held: z.number().optional(),
    objections_filed_count: z.number().optional(),
    stakeholder_meetings_count: z.number().optional(),
  }),
});
