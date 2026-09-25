/**
 * Bhoomi Sanket — ML Service Client
 * Typed HTTP caller connecting Next.js application layer to the FastAPI ML inference service.
 * Implements fallback handling, timeout protection, and staleness tagging.
 */

import {
  PredictionRequest,
  PredictionResponse,
  BatchPredictionRequest,
  BatchPredictionResponse,
  ModelHealthResponse,
  ModelInfoResponse,
} from "@/shared/types/ml-contract";

// Keep the server-side client on the IPv4 loopback address.  On Windows,
// `localhost` can resolve to ::1 while Uvicorn is only bound to 127.0.0.1.
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:8000";
const ML_SERVICE_SECRET = process.env.ML_SERVICE_SECRET || "dev-secret-local-only";
const REQUEST_TIMEOUT_MS = 6000;

export class MLClientError extends Error {
  code: string;
  isFallback: boolean;

  constructor(message: string, code = "ML_ERROR", isFallback = false) {
    super(message);
    this.name = "MLClientError";
    this.code = code;
    this.isFallback = isFallback;
  }
}

export async function checkMLServiceHealth(): Promise<ModelHealthResponse | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(`${ML_SERVICE_URL}/health`, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "X-Internal-Token": ML_SERVICE_SECRET,
      },
      cache: "no-store",
    });
    clearTimeout(timeout);

    if (!res.ok) return null;
    return (await res.json()) as ModelHealthResponse;
  } catch {
    return null;
  }
}

export async function getModelInfo(): Promise<ModelInfoResponse | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(`${ML_SERVICE_URL}/model-info`, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "X-Internal-Token": ML_SERVICE_SECRET,
      },
      cache: "no-store",
    });
    clearTimeout(timeout);

    if (!res.ok) return null;
    return (await res.json()) as ModelInfoResponse;
  } catch {
    return null;
  }
}

export async function callPredict(
  request: PredictionRequest
): Promise<{ response: PredictionResponse; isFallback: boolean }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${ML_SERVICE_URL}/predict`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Token": ML_SERVICE_SECRET,
      },
      body: JSON.stringify(request),
      cache: "no-store",
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const errText = await res.text();
      throw new MLClientError(
        `ML Service returned status ${res.status}: ${errText}`,
        "ML_SERVICE_HTTP_ERROR"
      );
    }

    const data = (await res.json()) as PredictionResponse;
    return { response: data, isFallback: false };
  } catch (err: unknown) {
    clearTimeout(timeout);
    throw new MLClientError(
      err instanceof Error ? err.message : "Unknown ML client error",
      "ML_SERVICE_HTTP_ERROR"
    );
  }
}

export async function callBatchPredict(
  request: BatchPredictionRequest
): Promise<BatchPredictionResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS * 2);

  try {
    const res = await fetch(`${ML_SERVICE_URL}/predict/batch`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Token": ML_SERVICE_SECRET,
      },
      body: JSON.stringify(request),
      cache: "no-store",
    });
    clearTimeout(timeout);

    if (!res.ok) {
      throw new MLClientError(
        `Batch ML service failed with status ${res.status}`,
        "BATCH_ML_ERROR"
      );
    }

    return (await res.json()) as BatchPredictionResponse;
  } catch (err: unknown) {
    clearTimeout(timeout);
    throw new MLClientError(
      err instanceof Error ? err.message : "Failed to execute batch prediction",
      "BATCH_TIMEOUT_OR_NETWORK"
    );
  }
}
