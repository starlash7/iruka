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
  for (const scene of ["unpacking", "peel", "card-front", "summary"]) {
    assert.doesNotThrow(() => playRevealCue(scene, false));
  }
});

test("sound cues follow the unpacking state instead of the removed film", async () => {
  const source = await import("node:fs/promises").then(({ readFile }) =>
    readFile(
      new URL("../src/features/pack-reveal/sounds.ts", import.meta.url),
      "utf8"
    )
  );

  assert.match(source, /scene === "unpacking"/);
  assert.match(source, /scene === "peel"/);
  assert.doesNotMatch(source, /scene === "hint"/);
  assert.doesNotMatch(source, /scene === "cinematic"/);
});
