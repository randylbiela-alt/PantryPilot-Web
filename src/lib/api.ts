import { publicEnv } from "./env";
import type {
  ApiErrorBody,
  Bootstrap,
  CreateGroceryItemInput,
  CreatePantryInput,
  GroceryItem,
  GroceryList,
  PantryItem,
  UpdateGroceryItemInput,
  UpdatePantryInput,
  User
} from "./types";
import type {
  CreateHouseholdInput,
  HouseholdSettings,
  ProfileSettings,
  UpdateProfileInput
} from "./onboarding-types";

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public correlationId?: string) {
    super(message);
    this.name = "ApiError";
  }
}

function headers(hasBody = false): HeadersInit {
  const result: Record<string, string> = { Accept: "application/json", "X-Client-Version": publicEnv.appVersion };
  if (hasBody) result["Content-Type"] = "application/json";return result;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  const requestHeaders = new Headers(headers(Boolean(init.body)));
  if (init.headers) new Headers(init.headers).forEach((value, key) => requestHeaders.set(key, value));
  try {
    response = await fetch(`${publicEnv.apiBaseUrl}${path}`, { ...init, credentials: "include", headers: requestHeaders, cache: "no-store" });
  } catch {
    throw new ApiError(0, "API_UNAVAILABLE", "PantryPilot API is unavailable. Confirm the API is running at localhost:3001.");
  }
  if (response.status === 204) return undefined as T;
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = (body as Partial<ApiErrorBody>).error;
    throw new ApiError(response.status, error?.code ?? "REQUEST_FAILED", error?.message ?? "The request could not be completed.", error?.correlationId ?? response.headers.get("x-correlation-id") ?? undefined);
  }
  return body as T;
}

export const api = {
  session: () => request<{ user: User | null }>("/auth/session"),
  devSession: () => {
    if (!publicEnv.allowDevAuth || publicEnv.deployment === "production") {
      throw new ApiError(403, "DEV_AUTH_DISABLED", "Development sign-in is disabled.");
    }
    return request<{ user: User }>("/auth/dev-session", { method: "POST", body: JSON.stringify({}) });
  },
  signOut: () => request<void>("/auth/sign-out", {
    method: "POST"
  }),

  createInvite: (householdId: string, input: { email: string; role: "ADMIN" | "ADULT" | "MEMBER" | "READ_ONLY"; expiresInDays: number }) => request<{ id: string; email: string; role: string; expiresAt: string; inviteUrl: string }>(`/households/${householdId}/invites`, { method: "POST", body: JSON.stringify(input) }),
  signOutAll: () =>
    request<void>("/auth/sign-out-all", {
      method: "POST"
    }),
  bootstrap: () => request<Bootstrap>("/bootstrap"),
  listPantry: (householdId: string) => request<PantryItem[]>(`/households/${householdId}/pantry`),
  createPantry: (householdId: string, input: CreatePantryInput) => request<PantryItem>(`/households/${householdId}/pantry`, { method: "POST", body: JSON.stringify(input) }),
  updatePantry: (householdId: string, itemId: string, input: UpdatePantryInput) => request<PantryItem>(`/households/${householdId}/pantry/${itemId}`, { method: "PATCH", body: JSON.stringify(input) }),
  deletePantry: (householdId: string, itemId: string, version: number) => request<void>(`/households/${householdId}/pantry/${itemId}?version=${version}`, { method: "DELETE" }),
  listGroceryLists: (householdId: string) => request<GroceryList[]>(`/households/${householdId}/grocery-lists`),
  createGroceryItem: (householdId: string, listId: string, input: CreateGroceryItemInput) => request<GroceryItem>(`/households/${householdId}/grocery-lists/${listId}/items`, { method: "POST", body: JSON.stringify(input) }),
  updateGroceryItem: (householdId: string, listId: string, itemId: string, input: UpdateGroceryItemInput) => request<GroceryItem>(`/households/${householdId}/grocery-lists/${listId}/items/${itemId}`, { method: "PATCH", body: JSON.stringify(input) }),
  deleteGroceryItem: (householdId: string, listId: string, itemId: string, version: number) => request<void>(`/households/${householdId}/grocery-lists/${listId}/items/${itemId}?version=${version}`, { method: "DELETE" }),
  updateGroceryList: (householdId: string, listId: string, input: { status?: "ACTIVE" | "COMPLETED" | "ARCHIVED"; name?: string; version: number }) => request<GroceryList>(`/households/${householdId}/grocery-lists/${listId}`, { method: "PATCH", body: JSON.stringify(input) }),
  profile: () => request<ProfileSettings>("/me/profile"),
  updateProfile: (input: UpdateProfileInput) => request<ProfileSettings>("/me/profile", { method: "PATCH", body: JSON.stringify(input) }),
  createHousehold: (input: CreateHouseholdInput) => request<{ household: HouseholdSettings; profile: ProfileSettings }>("/households", { method: "POST", body: JSON.stringify(input) }),
  household: (householdId: string) => request<HouseholdSettings>(`/households/${householdId}`),
  updateHousehold: (householdId: string, input: { name?: string; timeZone?: string; version: number }) => request<HouseholdSettings>(`/households/${householdId}`, { method: "PATCH", body: JSON.stringify(input) })
};



