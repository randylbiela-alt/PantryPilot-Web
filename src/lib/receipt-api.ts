import { publicEnv } from "./env";

export type OcrReceiptItem = {
  name: string;
  quantity: number;
  unit: string;
  category: string | null;
};

export type ReceiptAnalysis = {
  merchantName: string | null;
  purchaseDate: string | null;
  items: OcrReceiptItem[];
};

export type ReceiptImportResult = {
  created: number;
  updated: number;
  total: number;
  items: Array<{ id: string; name: string; action: "created" | "updated" }>;
};

function csrfToken(): string | undefined {
  if (typeof document === "undefined") return undefined;
  const candidates = ["csrfToken", "csrf-token", "XSRF-TOKEN"];
  for (const part of document.cookie.split(";")) {
    const [rawName, ...rawValue] = part.trim().split("=");
    if (candidates.includes(rawName) || rawName.toLowerCase().includes("csrf")) {
      return decodeURIComponent(rawValue.join("="));
    }
  }
  return undefined;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = csrfToken();
  const response = await fetch(`${publicEnv.apiBaseUrl}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "content-type": "application/json",
      ...(token ? { "x-csrf-token": token } : {}),
      ...(init?.headers ?? {})
    }
  });
  const body = await response.json().catch(() => null) as { error?: { message?: string } } | T | null;
  if (!response.ok) {
    const errorBody = body as { error?: { message?: string } } | null;
    throw new Error(errorBody?.error?.message ?? `Receipt request failed (${response.status}).`);
  }
  return body as T;
}

async function activeHouseholdId(): Promise<string> {
  const bootstrap = await request<{ activeHouseholdId?: string }>("/bootstrap", { method: "GET" });
  if (!bootstrap.activeHouseholdId) throw new Error("No active household is available.");
  return bootstrap.activeHouseholdId;
}

export const receiptApi = {
  async analyze(imageBase64: string, mimeType: "image/jpeg" | "image/png" | "image/webp") {
    const householdId = await activeHouseholdId();
    return request<ReceiptAnalysis>(`/households/${householdId}/receipt-import/analyze`, {
      method: "POST",
      body: JSON.stringify({ imageBase64, mimeType })
    });
  },
  async confirm(items: OcrReceiptItem[]) {
    const householdId = await activeHouseholdId();
    return request<ReceiptImportResult>(`/households/${householdId}/receipt-import/confirm`, {
      method: "POST",
      body: JSON.stringify({ items })
    });
  }
};
