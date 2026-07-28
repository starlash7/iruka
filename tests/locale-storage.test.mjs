import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createServer } from "vite";

let getStoredLocale;
let saveStoredLocale;
let server;

before(async () => {
  server = await createServer({
    appType: "custom",
    optimizeDeps: { noDiscovery: true },
    server: { hmr: false, middlewareMode: true }
  });
  ({ getStoredLocale, saveStoredLocale } =
    await server.ssrLoadModule("/src/localeStorage.ts"));
});

after(async () => {
  await server?.close();
});

test("uses English when browser storage is unavailable", () => {
  const restrictedStorage = {
    getItem: () => {
      throw new DOMException("Blocked", "SecurityError");
    },
    setItem: () => {
      throw new DOMException("Blocked", "SecurityError");
    }
  };

  assert.equal(getStoredLocale(restrictedStorage), "en");
  assert.doesNotThrow(() => saveStoredLocale(restrictedStorage, "ko"));
  assert.doesNotThrow(() => saveStoredLocale(undefined, "ko"));
});

test("restores only supported locales", () => {
  assert.equal(getStoredLocale({ getItem: () => "ko" }), "ko");
  assert.equal(getStoredLocale({ getItem: () => "fr" }), "en");
});
