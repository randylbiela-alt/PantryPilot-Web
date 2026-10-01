import { publicEnv } from "./env";
import type { CreateMealInput, MealPlan, PlannedMeal, UpdateMealInput } from "./meal-types";

export class MealApiError extends Error { constructor(public status: number, public code: string, message: string, public correlationId?: string) { super(message); } }
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try { response = await fetch(`${publicEnv.apiBaseUrl}${path}`, { ...init, credentials: "include", headers: { "Content-Type": "application/json", "X-Client-Version": publicEnv.appVersion, ...(init.headers ?? {}) } }); }
  catch { throw new MealApiError(0, "API_UNAVAILABLE", "PantryPilot could not reach the API."); }
  if (response.status === 204) return undefined as T;
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new MealApiError(response.status, body?.error?.code ?? "REQUEST_FAILED", body?.error?.message ?? "The request failed.", body?.error?.correlationId);
  return body as T;
}
export const mealApi = {
  week: (householdId: string, weekStartDate: string) => request<MealPlan | null>(`/households/${householdId}/meal-plans/week?weekStartDate=${encodeURIComponent(weekStartDate)}`),
  createPlan: (householdId: string, weekStartDate: string) => request<MealPlan>(`/households/${householdId}/meal-plans`, { method: "POST", body: JSON.stringify({ weekStartDate }) }),
  createMeal: (householdId: string, planId: string, input: CreateMealInput) => request<PlannedMeal>(`/households/${householdId}/meal-plans/${planId}/meals`, { method: "POST", body: JSON.stringify(input) }),
  updateMeal: (householdId: string, planId: string, mealId: string, input: UpdateMealInput) => request<PlannedMeal>(`/households/${householdId}/meal-plans/${planId}/meals/${mealId}`, { method: "PATCH", body: JSON.stringify(input) }),
  deleteMeal: (householdId: string, planId: string, mealId: string, version: number) => request<void>(`/households/${householdId}/meal-plans/${planId}/meals/${mealId}?version=${version}`, { method: "DELETE" })
};

