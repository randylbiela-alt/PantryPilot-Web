export type MealType = "BREAKFAST" | "LUNCH" | "DINNER";
export type PlannedMeal = { id: string; mealPlanId: string; mealDate: string; mealType: MealType; displayName: string; notes: string | null; servings: number; version: number };
export type MealPlan = { id: string; householdId: string; weekStartDate: string; status: "DRAFT" | "GENERATING" | "READY" | "FAILED" | "ARCHIVED"; generatedBy: string; version: number; meals: PlannedMeal[] };
export type CreateMealInput = { mealDate: string; mealType: MealType; displayName: string; notes?: string | null; servings: number };
export type UpdateMealInput = Partial<CreateMealInput> & { version: number };
