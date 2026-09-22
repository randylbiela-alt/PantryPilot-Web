export type User = {
  id: string;
  email: string | null;
  displayName: string | null;
};

export type Profile = {
  householdSizeDefault: number;
  weeklyBudget: string | number | null;
  defaultDiet: string;
  onboardingComplete: boolean;
};

export type Household = {
  id: string;
  name: string;
  role: string;
};

export type PantryItem = {
  id: string;
  name: string;
  quantity: string | number;
  unit: string;
  category: string | null;
  expirationDate: string | null;
  version: number;
};

export type GroceryItem = {
  id: string;
  name: string;
  checked: boolean;
  version: number;
};

export type GroceryListStatus =
  | "ACTIVE"
  | "COMPLETED"
  | "ARCHIVED";

export type GroceryList = {
  id: string | null;
  name: string;
  status?: GroceryListStatus;
  version?: number;
  items: GroceryItem[];
};

export type Bootstrap = {
  user: User;
  profile: Profile | null;
  households: Household[];
  activeHouseholdId: string | null;
  pantry: PantryItem[];
  groceryList: GroceryList;
  mealPlan: unknown | null;
};

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    correlationId?: string;
    details?: unknown;
  };
};

export type CreatePantryInput = {
  name: string;
  quantity: number;
  unit: string;
  category?: string | null;
  expirationDate?: string | null;
};

export type UpdatePantryInput =
  Partial<CreatePantryInput> & {
    version: number;
  };

export type CreateGroceryItemInput = {
  name: string;
};

export type UpdateGroceryItemInput = {
  name?: string;
  checked?: boolean;
  version: number;
};

export type UpdateGroceryListInput = {
  name?: string;
  status?: GroceryListStatus;
  version: number;
};
