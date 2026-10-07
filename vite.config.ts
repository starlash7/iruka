import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const deployment = loadEnv(mode, process.cwd(), "VITE_").VITE_IRUKA_DEPLOYMENT ?? "giwa";
  if (deployment !== "giwa" && deployment !== "monad") {
    throw new Error(`Unknown Iruka deployment: ${deployment}`);
  }
  return {
  plugins: [react()],
  build: {
    minify: "esbuild",
    sourcemap: false
  }
  };
});
