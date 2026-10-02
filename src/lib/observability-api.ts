import { publicEnv } from "./env";

export type ObservabilitySummary = {
  status: "healthy" | "degraded";
  checkedAt: string;
  correlationId: string;
  application: {
    name: string;
    version: string;
    environment: string;
    nodeVersion: string;
    startedAt: string;
    uptimeSeconds: number;
  };
  checks: {
    api: { status: "healthy" | "degraded" };
    database: { status: "healthy" | "degraded"; latencyMs: number | null };
    ocr: { status: "configured" | "unavailable"; model: string };
    productLookup: { status: "configured" | "unavailable"; provider: string };
  };
  runtime: { rssMb: number; heapUsedMb: number; heapTotalMb: number };
};

export async function loadObservability(): Promise<ObservabilitySummary> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/observability/summary`, {
    credentials: "include",
    cache: "no-store",
    headers: { Accept: "application/json", "X-Client-Version": publicEnv.appVersion }
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error?.message ?? "Could not load monitoring data.");
  return body as ObservabilitySummary;
}
