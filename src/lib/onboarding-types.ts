export type Diet = "No restrictions" | "Vegetarian" | "Vegan" | "Gluten-free" | "Dairy-free" | "Low carb";
export type ProfileSettings = { userId:string; householdSizeDefault:number; weeklyBudget:string|number|null; defaultDiet:Diet; locale:string; timeZone:string; onboardingComplete:boolean; version:number };
export type HouseholdSettings = { id:string; name:string; timeZone:string; version:number };
export type CreateHouseholdInput = { name:string; householdSize:number; weeklyBudget:number|null; dietaryPreference:Diet; locale:string; timeZone:string };
export type UpdateProfileInput = { householdSize?:number; weeklyBudget?:number|null; dietaryPreference?:Diet; locale?:string; timeZone?:string; onboardingComplete?:boolean; version:number };
