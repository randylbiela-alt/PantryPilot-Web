import type { NextConfig } from "next";

const deployment = process.env.NEXT_PUBLIC_DEPLOYMENT_ENV ?? "local";
const allowDevAuth = process.env.NEXT_PUBLIC_ALLOW_DEV_AUTH === "true";
if (deployment === "production" && allowDevAuth) {
  throw new Error("NEXT_PUBLIC_ALLOW_DEV_AUTH must be false for production deployments.");
}
const nextConfig: NextConfig = { output: "standalone", reactStrictMode: true };
export default nextConfig;
