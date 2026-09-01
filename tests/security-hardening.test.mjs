import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

async function readProjectFile(filePath) {
  return readFile(join(root, filePath), "utf8");
}

function getHeader(headers, key) {
  return headers.find((header) => header.key.toLowerCase() === key.toLowerCase())?.value;
}

test("production build disables source maps", async () => {
  const viteConfig = await readProjectFile("vite.config.ts");

  assert.match(viteConfig, /sourcemap:\s*false/);
});

test("production entry does not load the product application bundle", async () => {
  const mainSource = await readProjectFile("src/main.tsx");

  assert.match(mainSource, /import\.meta\.env\.PROD/);
  assert.match(mainSource, /import\("\.\/app-main"\)/);
  assert.doesNotMatch(mainSource, /from ["']\.\/App["']/);
});

test("public entry does not describe the private product", async () => {
  const html = await readProjectFile("index.html");

  assert.match(
    html,
    /<meta\s+name="robots"\s+content="noindex, nofollow, noarchive, nosnippet, noimageindex"\s*\/?>/
  );
  assert.doesNotMatch(
    html,
    /GIWA-ready|collectible random packs|verified vault|marketplace exits|card redemption/i
  );
});

test("public deployment asks crawlers not to index any route", async () => {
  const robots = await readProjectFile("public/robots.txt");

  assert.match(robots, /^User-agent:\s*\*$/m);
  assert.match(robots, /^Content-Signal:\s*ai-train=no, search=no, ai-input=no$/m);
  assert.match(robots, /^Disallow:\s*\/$/m);
});

test("public deployment sends browser security headers", async () => {
  const vercelConfig = JSON.parse(await readProjectFile("vercel.json"));
  const globalHeaders = vercelConfig.headers.find(
    (entry) => entry.source === "/(.*)"
  )?.headers ?? [];
  const apiHeaders = vercelConfig.headers.find(
    (entry) => entry.source === "/api/(.*)"
  )?.headers ?? [];
  const contentSecurityPolicy = getHeader(globalHeaders, "Content-Security-Policy");

  assert.equal(getHeader(globalHeaders, "X-Content-Type-Options"), "nosniff");
  assert.equal(getHeader(globalHeaders, "X-Frame-Options"), "DENY");
  assert.equal(
    getHeader(globalHeaders, "Referrer-Policy"),
    "strict-origin-when-cross-origin"
  );
  assert.equal(
    getHeader(globalHeaders, "X-Robots-Tag"),
    "noindex, nofollow, noarchive, nosnippet, noimageindex"
  );
  assert.match(contentSecurityPolicy ?? "", /frame-ancestors 'none'/);
  assert.match(contentSecurityPolicy ?? "", /object-src 'none'/);
  assert.equal(getHeader(apiHeaders, "Cache-Control"), "no-store");
});

test("Keeper fulfillment rejects foreign production origins", async () => {
  const { isAllowedRequestOrigin } = await import("../api/giwa/fulfill.mjs");

  assert.equal(
    isAllowedRequestOrigin(
      { headers: { origin: "https://attacker.example" } },
      { VERCEL_ENV: "production" }
    ),
    false
  );
  assert.equal(
    isAllowedRequestOrigin(
      { headers: { origin: "https://playiruka.space" } },
      { VERCEL_ENV: "production" }
    ),
    true
  );
  assert.equal(
    isAllowedRequestOrigin(
      { headers: { origin: "https://random-project.vercel.app" } },
      { VERCEL_ENV: "preview", VERCEL_URL: "iruka-preview.vercel.app" }
    ),
    false
  );
  assert.equal(
    isAllowedRequestOrigin(
      { headers: { origin: "https://iruka-preview.vercel.app" } },
      { VERCEL_ENV: "preview", VERCEL_URL: "iruka-preview.vercel.app" }
    ),
    true
  );
});

test("server-only credentials are not tracked as environment files", async () => {
  const gitignore = await readProjectFile(".gitignore");
  const vercelIgnore = await readProjectFile(".vercelignore");

  assert.match(gitignore, /^\.env\.local$/m);
  assert.match(gitignore, /^\.vercel$/m);
  assert.match(vercelIgnore, /^output\/$/m);
});
