import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "API_");
  return {
    plugins: [react()],
    server: {
      fs: { deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "**/seed/**"] },
      proxy: { "/api": { target: `http://127.0.0.1:${process.env.API_PORT || env.API_PORT || 8787}`, changeOrigin: true } }
    },
    build: { minify: "esbuild", sourcemap: false }
  };
});
