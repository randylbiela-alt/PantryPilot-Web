import { publicEnv } from "./env";
import type { ApiErrorBody, Bootstrap, CreatePantryInput, PantryItem, UpdatePantryInput, User } from "./types";

export class ApiError extends Error {
  constructor(public status:number,public code:string,message:string,public correlationId?:string){super(message);this.name="ApiError";}
}
function headers(hasBody=false):HeadersInit {
  const h:Record<string,string>={Accept:"application/json","X-Client-Version":publicEnv.appVersion};
  if(hasBody)h["Content-Type"]="application/json";
  if(publicEnv.allowDevAuth&&publicEnv.deployment!=="production")h.Authorization="Bearer dev-token";
  return h;
}
async function request<T>(path:string,init:RequestInit={}):Promise<T>{
  let response: Response;
  const requestHeaders = new Headers(headers(Boolean(init.body)));
  if (init.headers) {
    new Headers(init.headers).forEach((value, key) => requestHeaders.set(key, value));
  }
  try {
    response = await fetch(`${publicEnv.apiBaseUrl}${path}`, {
      ...init,
      credentials: "include",
      headers: requestHeaders,
      cache: "no-store"
    });
  }
  catch { throw new ApiError(0,"API_UNAVAILABLE","PantryPilot API is unavailable. Confirm the API is running at localhost:3001."); }
  if(response.status===204)return undefined as T;
  const body=await response.json().catch(()=>({}));
  if(!response.ok){const e=(body as Partial<ApiErrorBody>).error;throw new ApiError(response.status,e?.code??"REQUEST_FAILED",e?.message??"The request could not be completed.",e?.correlationId??response.headers.get("x-correlation-id")??undefined);}
  return body as T;
}
export const api={
  session:()=>request<{user:User|null}>("/auth/session"), signOut:()=>request<void>("/auth/sign-out",{method:"POST"}), bootstrap:()=>request<Bootstrap>("/bootstrap"),
  listPantry:(householdId:string)=>request<PantryItem[]>(`/households/${householdId}/pantry`),
  createPantry:(householdId:string,input:CreatePantryInput)=>request<PantryItem>(`/households/${householdId}/pantry`,{method:"POST",body:JSON.stringify(input)}),
  updatePantry:(householdId:string,itemId:string,input:UpdatePantryInput)=>request<PantryItem>(`/households/${householdId}/pantry/${itemId}`,{method:"PATCH",body:JSON.stringify(input)}),
  deletePantry:(householdId:string,itemId:string,version:number)=>request<void>(`/households/${householdId}/pantry/${itemId}?version=${version}`,{method:"DELETE"})
};
