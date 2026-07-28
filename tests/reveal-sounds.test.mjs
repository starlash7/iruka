import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createServer } from "vite";

let playRevealCue;
let server;

before(async () => {
  server = await createServer({
    appType: "custom",
    optimizeDeps: { noDiscovery: true },
    server: { hmr: false, middlewareMode: true }
  });
  ({ playRevealCue } =
    await server.ssrLoadModule("/src/features/pack-reveal/sounds.ts"));
});

after(async () => {
  await server?.close();
});

test("unsupported audio never interrupts the reveal timeline", () => {
  assert.doesNotThrow(() => playRevealCue("charging", false));
  assert.doesNotThrow(() => playRevealCue("summary", false));
});
