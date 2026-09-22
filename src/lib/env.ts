import { z } from "zod";
const schema=z.object({
  apiBaseUrl:z.string().url(), appVersion:z.string().min(1), deployment:z.enum(["local","test","production"]), allowDevAuth:z.boolean()
}).superRefine((v,ctx)=>{if(v.deployment==="production"&&v.allowDevAuth)ctx.addIssue({code:"custom",message:"Development authentication cannot be enabled in production."})});
export const publicEnv=schema.parse({
  apiBaseUrl:process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1",
  appVersion:process.env.NEXT_PUBLIC_APP_VERSION ?? "local",
  deployment:process.env.NEXT_PUBLIC_DEPLOYMENT_ENV ?? "local",
  allowDevAuth:process.env.NEXT_PUBLIC_ALLOW_DEV_AUTH === "true"
});
