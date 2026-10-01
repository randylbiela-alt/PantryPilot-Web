import type { Recipe } from "./recipe-types";

export type MealType = "BREAKFAST" | "LUNCH" | "DINNER";

export type PlannedMeal = {
  id: string;
  mealPlanId: string;
  recipeId: string | null;
  mealDate: string;
  mealType: MealType;
  displayName: string;
  notes: string | null;
  servings: number;
  version: number;
  recipe: Recipe | null;
};

export type MealPlan = {
  id: string;
  householdId: string;
  weekStartDate: string;
  meals: PlannedMeal[];
};

/**
 * Input accepted by the existing free-text meal dialog.
 * recipeId is optional so a meal can still be created manually.
 */
export type CreateMealInput = {
  mealDate: string;
  mealType: MealType;
  displayName: string;
  notes?: string | null;
  servings: number;
  recipeId?: string | null;
};

/**
 * Input used when selecting a Recipe from the linked-recipe workflow.
 */
export type RecipeMealInput = {
  mealDate: string;
  mealType: MealType;
  recipeId: string;
  servings?: number;
  notes?: string | null;
};

export type MealInput = RecipeMealInput;
