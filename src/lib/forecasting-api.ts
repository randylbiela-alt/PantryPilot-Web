import { publicEnv } from "./env";

export type ForecastingSummary = {
  generatedAt: string;
  horizon: { weekStartDate: string; maximumDays: number };
  confidence: { level: "HIGH" | "MEDIUM" | "LOW"; score: number; reasons: string[] };
  expirationRisk: { within3Days: number; within7Days: number; within14Days: number; within30Days: number; useFirst: Array<{ itemId: string | null; name: string; expirationDate: string; daysRemaining: number; priority: string }> };
  mealCoverage: { plannedMeals: number; cookableMeals: number; mealsAtRisk: number; coveragePercent: number; missingMeals: Array<{ mealId: string; recipeName: string | null; missingIngredients: string[] }> };
  shoppingPressure: { score: number; level: "HIGH" | "MEDIUM" | "LOW"; lowStockItems: number; missingIngredients: number; openGroceryItems: number };
  pantryCoverage: { recipesEvaluated: number; recipesReady: number; recipesAt80Plus: number; averageRecipeMatch: number; categoryRisks: Array<{ category: string; lowStock: number; expiring30: number; total: number }> };
  limitations: string[];
};

export async function loadForecasting(householdId: string, weekStartDate?: string): Promise<ForecastingSummary> {
  const query = weekStartDate ? `?weekStartDate=${encodeURIComponent(weekStartDate)}` : "";
  const response = await fetch(`${publicEnv.apiBaseUrl}/households/${householdId}/forecasting/summary${query}`, { credentials: "include", cache: "no-store", headers: { Accept: "application/json", "X-Client-Version": publicEnv.appVersion } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error?.message ?? "Could not load forecasting data.");
  return body as ForecastingSummary;
}
