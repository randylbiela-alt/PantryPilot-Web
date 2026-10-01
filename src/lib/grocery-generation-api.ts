import { publicEnv } from "./env";
export type GroceryGenerationItem = { id: string; name: string; quantity: number; unit: string };
export type GroceryGenerationResult = { groceryListId: string; generated: number; existingSkipped: number; items: GroceryGenerationItem[] };
export async function generateGroceryList(householdId: string, weekStartDate: string): Promise<GroceryGenerationResult> {
  const response = await fetch(`${publicEnv.apiBaseUrl}/households/${householdId}/grocery-generation`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json", "X-Client-Version": publicEnv.appVersion }, body: JSON.stringify({ weekStartDate }) });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error?.message ?? "Could not generate the grocery list.");
  return body as GroceryGenerationResult;
}
