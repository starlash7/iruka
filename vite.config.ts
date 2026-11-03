import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "API_");
  const securityHeaders={
    'X-Content-Type-Options':'nosniff',
    'Referrer-Policy':'no-referrer',
    'X-Frame-Options':'DENY',
    'Content-Security-Policy':"frame-ancestors 'none'; object-src 'none'; base-uri 'self'",
  };
  return {
    plugins: [react()],
    preview: {headers:securityHeaders},
    server: {
      host:"127.0.0.1",
      headers:securityHeaders,
      fs: { strict:true, allow:[process.cwd()], deny: [".env", ".env.*", "*.{crt,pem,key,p12,pfx}", "**/.git/**", "**/seed/**", "**/.context/**", "**/docs/internal/**", "**/.conductor/**"] },
      proxy: { "/api": { target: `http://127.0.0.1:${process.env.API_PORT || env.API_PORT || 8787}`, changeOrigin: true } }
    },
    build: { minify: "esbuild", sourcemap: false }
  };
});
