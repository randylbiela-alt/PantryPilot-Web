import type { Recipe } from "./recipe-types";
export type MealType = "BREAKFAST" | "LUNCH" | "DINNER";
export type PlannedMeal = { id:string; mealPlanId:string; recipeId:string|null; mealDate:string; mealType:MealType; displayName:string; notes:string|null; servings:number; version:number; recipe:Recipe|null };
export type MealPlan = { id:string; householdId:string; weekStartDate:string; meals:PlannedMeal[] };
export type MealInput = { mealDate:string; mealType:MealType; recipeId:string; servings?:number; notes?:string|null };
