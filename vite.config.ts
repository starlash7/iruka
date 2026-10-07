import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync } from "node:fs";
import { isAddress, zeroAddress } from "viem";

type SecurityConfig = {
  headers: { source: string; headers: { key: string; value: string }[] }[];
};

export function validateReleaseConfig(
  env: Record<string, string>,
  evidence: { chainId: number; contract: string },
  security: SecurityConfig
) {
  const address = env.VITE_MONAD_PACK_BATCH_ADDRESS;
  if (evidence.chainId !== 10143 || !address || !isAddress(address)
    || address.toLowerCase() === zeroAddress
    || address.toLowerCase() !== evidence.contract.toLowerCase()) {
    throw new Error("Monad contract address must match the verified testnet deployment");
  }
  const csp = security.headers.find(entry => entry.source === "/(.*)")?.headers
    .find(header => header.key.toLowerCase() === "content-security-policy")?.value;
  const connectSources = csp?.split(";").map(directive => directive.trim().split(/\s+/))
    .find(directive => directive[0] === "connect-src")?.slice(1) ?? [];
  for (const [key, fallback] of [
    ["VITE_MONAD_RPC_URL", "https://testnet-rpc.monad.xyz"],
    ["VITE_GIWA_RPC_URL", "https://sepolia-rpc.giwa.io"]
  ]) {
    let url: URL;
    try {
      url = new URL(env[key] || fallback);
    } catch {
      throw new Error(`${key} requires a valid HTTPS RPC URL`);
    }
    if (url.protocol !== "https:") throw new Error(`${key} requires an HTTPS RPC URL`);
    if (!connectSources.includes(url.origin)) {
      throw new Error(`${key} origin must be explicitly allowed by CSP connect-src in vercel.json`);
    }
  }
}

export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const deployment = env.VITE_IRUKA_DEPLOYMENT ?? "giwa";
  if (deployment !== "giwa" && deployment !== "monad") {
    throw new Error(`Unknown Iruka deployment: ${deployment}`);
  }
  if (command === "build" && (process.env.IRUKA_RELEASE_VALIDATE === "1" || process.env.VERCEL_ENV === "production")) {
    validateReleaseConfig(env,
      JSON.parse(readFileSync("docs/evidence/monad-testnet.json", "utf8")),
      JSON.parse(readFileSync("vercel.json", "utf8")));
  }
  return {
    plugins: [react()],
    build: {
      minify: "esbuild",
      sourcemap: false
    }
  };
});
