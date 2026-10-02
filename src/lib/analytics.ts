import type { GroceryList, PantryItem } from "./types";
import type { IntelligenceDashboardResponse } from "./intelligence-api";
import type { MealPlan } from "./meal-types";
import type { Recipe } from "./recipe-types";

export type CategoryMetric = { name: string; count: number; percent: number };
export type AnalyticsSnapshot = {
  inventory: { items: number; units: number; categories: number; lowStock: number; expiring: number };
  grocery: { total: number; completed: number; open: number; completionPercent: number };
  meals: { planned: number; cookable: number; coveragePercent: number; linkedRecipes: number };
  recipes: { total: number; favorites: number; recommended: number; averageIngredients: number };
  categories: CategoryMetric[];
  insights: Array<{ tone: "success" | "warning" | "danger"; title: string; detail: string }>;
};

export function buildAnalytics(input: { pantry: PantryItem[]; groceryList: GroceryList; recipes: Recipe[]; mealPlan: MealPlan | null; intelligence: IntelligenceDashboardResponse }): AnalyticsSnapshot {
  const { pantry, groceryList, recipes, mealPlan, intelligence } = input;
  const units = pantry.reduce((sum, item) => sum + Math.max(0, Number(item.quantity) || 0), 0);
  const categoryCounts = new Map<string, number>();
  pantry.forEach(item => { const name = item.category?.trim() || "Uncategorized"; categoryCounts.set(name, (categoryCounts.get(name) ?? 0) + 1); });
  const categories = [...categoryCounts.entries()].sort((a,b)=>b[1]-a[1]).map(([name,count])=>({ name, count, percent: pantry.length ? Math.round(count / pantry.length * 100) : 0 }));
  const groceryTotal = groceryList.items.length;
  const groceryCompleted = groceryList.items.filter(item => item.checked).length;
  const planned = mealPlan?.meals.length ?? intelligence.readiness.plannedMeals;
  const linkedRecipes = mealPlan?.meals.filter(meal => Boolean(meal.recipeId)).length ?? 0;
  const cookable = intelligence.readiness.cookableMeals;
  const favorites = recipes.filter(recipe => recipe.favorite).length;
  const averageIngredients = recipes.length ? Math.round(recipes.reduce((sum,recipe)=>sum+recipe.ingredients.length,0)/recipes.length) : 0;
  const insights: AnalyticsSnapshot["insights"] = [];
  if (!intelligence.dashboard.lowStockCount && !intelligence.dashboard.expiringCount) insights.push({ tone:"success", title:"Inventory risk is clear", detail:"No low-stock or near-expiration items are currently flagged." });
  if (intelligence.dashboard.lowStockCount) insights.push({ tone:"warning", title:"Restock attention needed", detail:`${intelligence.dashboard.lowStockCount} pantry item${intelligence.dashboard.lowStockCount===1?" is":"s are"} below threshold.` });
  if (intelligence.dashboard.expiringCount) insights.push({ tone:"danger", title:"Use expiring items first", detail:`${intelligence.dashboard.expiringCount} item${intelligence.dashboard.expiringCount===1?" expires":"s expire"} within seven days.` });
  if (planned === 0) insights.push({ tone:"warning", title:"Plan the week", detail:"No meals are currently planned for this week." });
  else if (cookable < planned) insights.push({ tone:"warning", title:"Close meal gaps", detail:`${planned-cookable} planned meal${planned-cookable===1?" needs":"s need"} missing ingredients resolved.` });
  if (groceryTotal && groceryCompleted === groceryTotal) insights.push({ tone:"success", title:"Shopping list complete", detail:"Every item on the active grocery list is checked." });
  return {
    inventory:{ items:pantry.length, units:Math.round(units*100)/100, categories:categoryCounts.size, lowStock:intelligence.dashboard.lowStockCount, expiring:intelligence.dashboard.expiringCount },
    grocery:{ total:groceryTotal, completed:groceryCompleted, open:groceryTotal-groceryCompleted, completionPercent:groceryTotal?Math.round(groceryCompleted/groceryTotal*100):0 },
    meals:{ planned, cookable, coveragePercent:planned?Math.round(cookable/planned*100):0, linkedRecipes },
    recipes:{ total:recipes.length, favorites, recommended:intelligence.dashboard.recommendedCount, averageIngredients },
    categories,
    insights
  };
}
