import { publicEnv } from "./env";

export type MissingIngredient = {
  name: string;
  requiredQuantity: number;
  availableQuantity: number;
  unit: string;
};

export type Recommendation = {
  recipeId: string;
  recipeName: string;
  score: number;
  availableIngredients: number;
  totalIngredients: number;
  missingIngredients: MissingIngredient[];
};

export type LowStockAlert = {
  itemId: string | null;
  name: string;
  currentQuantity: number;
  threshold: number;
  unit: string;
};

export type ExpiringItem = {
  itemId: string | null;
  name: string;
  expirationDate: string;
  daysRemaining: number;
  priority: "CRITICAL" | "HIGH" | "MEDIUM";
};

export type Readiness = {
  plannedMeals: number;
  cookableMeals: number;
  score: number;
  mealsMissingIngredients: Array<{
    mealId: string;
    recipeName: string | null;
    missingIngredients: string[];
  }>;
};

export type IntelligenceDashboardResponse = {
  dashboard: {
    weekStartDate: string;
    lowStockCount: number;
    expiringCount: number;
    recommendedCount: number;
    readinessScore: number;
  };
  lowStock: LowStockAlert[];
  expiring: ExpiringItem[];
  recommendations: Recommendation[];
  readiness: Readiness;
};

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${publicEnv.apiBaseUrl}${path}`, {
    credentials: "include",
    headers: { "X-Client-Version": publicEnv.appVersion }
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body?.error?.message ?? "Could not load Pantry Intelligence.");
  }
  return body as T;
}

export const intelligenceApi = {
  dashboard: (householdId: string, weekStartDate?: string) =>
    request<IntelligenceDashboardResponse>(
      `/households/${householdId}/intelligence/dashboard${
        weekStartDate ? `?weekStartDate=${encodeURIComponent(weekStartDate)}` : ""
      }`
    )
};
