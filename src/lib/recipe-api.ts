import { publicEnv } from "./env";
import type { Recipe, RecipeInput } from "./recipe-types";

export class RecipeApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public correlationId?: string
  ) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("X-Client-Version", publicEnv.appVersion);

  /*
   * Fastify rejects an empty request with Content-Type: application/json.
   * Only send that header when the request actually contains a body.
   */
  if (init.body !== undefined && init.body !== null) {
    headers.set("Content-Type", "application/json");
  } else {
    headers.delete("Content-Type");
  }

  let response: Response;

  try {
    response = await fetch(`${publicEnv.apiBaseUrl}${path}`, {
      ...init,
      credentials: "include",
      headers
    });
  } catch {
    throw new RecipeApiError(
      0,
      "API_UNAVAILABLE",
      "PantryPilot could not reach the API."
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new RecipeApiError(
      response.status,
      body?.error?.code ?? "REQUEST_FAILED",
      body?.error?.message ?? "The request failed.",
      body?.error?.correlationId
    );
  }

  return body as T;
}

export const recipeApi = {
  list: (householdId: string, search = "") =>
    request<Recipe[]>(
      `/households/${householdId}/recipes${
        search ? `?search=${encodeURIComponent(search)}` : ""
      }`
    ),

  create: (householdId: string, input: RecipeInput) =>
    request<Recipe>(`/households/${householdId}/recipes`, {
      method: "POST",
      body: JSON.stringify(input)
    }),

  update: (
    householdId: string,
    recipeId: string,
    input: RecipeInput & { version: number }
  ) =>
    request<Recipe>(`/households/${householdId}/recipes/${recipeId}`, {
      method: "PATCH",
      body: JSON.stringify(input)
    }),

  delete: (householdId: string, recipeId: string, version: number) =>
    request<void>(
      `/households/${householdId}/recipes/${recipeId}?version=${version}`,
      { method: "DELETE" }
    )
};
