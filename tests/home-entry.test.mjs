import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { readFile } from "node:fs/promises";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

let server;
let HomeEntry;

before(async () => {
  server = await createServer({
    appType: "custom",
    optimizeDeps: { noDiscovery: true },
    server: { hmr: false, middlewareMode: true }
  });
  ({ HomeEntry } = await server.ssrLoadModule("/src/HomeEntry.tsx"));
});

after(async () => {
  await server?.close();
});

test("home entry presents Play Iruka before the product home", () => {
  const markup = renderToStaticMarkup(
    React.createElement(HomeEntry, { onEnter: () => undefined })
  );

  assert.match(markup, /Play Iruka!/);
  assert.match(markup, /iruka-entry-stage/);
  assert.match(markup, /iruka-entry-action/);
  assert.doesNotMatch(markup, /iruka-beam-action|iruka-entry-beam/);
  assert.doesNotMatch(markup, /<svg/);
});

test("home entry keeps the sky background free of a kinetic grid", async () => {
  const [markup, stylesheet] = await Promise.all([
    Promise.resolve(
      renderToStaticMarkup(React.createElement(HomeEntry, { onEnter: () => undefined }))
    ),
    readFile(new URL("../src/styles.css", import.meta.url), "utf8")
  ]);

  assert.doesNotMatch(markup, /iruka-entry-grid/);
  assert.doesNotMatch(stylesheet, /\.iruka-entry-grid/);
});

test("home entry action keeps the shared Iruka glass treatment", async () => {
  const stylesheet = await readFile(
    new URL("../src/styles.css", import.meta.url),
    "utf8"
  );

  assert.doesNotMatch(
    stylesheet,
    /\.iruka-entry-action,\s*\.account-deposit-button\.iruka-action-button,\s*\.account-faucet-action\.iruka-action-button\s*\{[^}]*background:\s*#1677ff;/is
  );
  assert.doesNotMatch(
    stylesheet,
    /\.account-deposit-button\.iruka-action-button,\s*\.account-faucet-action\.iruka-action-button\s*\{[^}]*background:\s*#1677ff;/is
  );
});

test("home entry unfolds its sky background behind the controls", async () => {
  const [markup, stylesheet] = await Promise.all([
    Promise.resolve(
      renderToStaticMarkup(React.createElement(HomeEntry, { onEnter: () => undefined }))
    ),
    readFile(new URL("../src/styles.css", import.meta.url), "utf8")
  ]);

  assert.match(markup, /iruka-entry-pixel-unfold/);
  assert.match(stylesheet, /\.iruka-entry-pixel-unfold \{[\s\S]*?pointer-events: none;/);
  assert.doesNotMatch(stylesheet, /\.iruka-entry \{[\s\S]*?iruka-entry-sky-ocean\.png/);
});

test("home entry draws each unfold tile once instead of repainting the full grid", async () => {
  const pixelUnfoldSource = await readFile(
    new URL("../src/HomePixelUnfold.tsx", import.meta.url),
    "utf8"
  );

  assert.match(pixelUnfoldSource, /let revealedTileCount = 0;/);
  assert.match(pixelUnfoldSource, /for \(let index = revealedTileCount; index < nextTileCount; index \+= 1\)/);
  assert.doesNotMatch(pixelUnfoldSource, /tiles\.forEach\(\(tile, index\) =>/);
});

test("home entry introduces the next favorite prompt above its action", async () => {
  const [markup, stylesheet] = await Promise.all([
    Promise.resolve(
      renderToStaticMarkup(React.createElement(HomeEntry, { onEnter: () => undefined }))
    ),
    readFile(new URL("../src/styles.css", import.meta.url), "utf8")
  ]);

  assert.match(markup, /Find your next favorite/);
  assert.match(markup, /iruka-entry-prompt/);
  assert.match(stylesheet, /\.iruka-entry-actions \{[\s\S]*?gap: 10px;/);
  assert.match(stylesheet, /\.iruka-entry-prompt \{[\s\S]*?min-height: 1\.5em;/);
  assert.match(stylesheet, /\.iruka-entry-actions \{[\s\S]*?width: min\(100%, 360px\);/);
  assert.match(stylesheet, /\.iruka-entry-prompt \{[\s\S]*?font-size: clamp\(18px, 1\.55vw, 22px\);/);
  assert.match(stylesheet, /\.iruka-entry-prompt \{[\s\S]*?font-family: Geist, Pretendard, ui-sans-serif, system-ui, sans-serif;/);
  assert.match(stylesheet, /\.iruka-entry-prompt \{[\s\S]*?font-weight: 600;/);
  assert.match(stylesheet, /\.iruka-entry-prompt > span \{[\s\S]*?text-align: center;/);
});

test("entry prompt resolves from left to right without showing the full text first", async () => {
  const [scrambleSource, stylesheet] = await Promise.all([
    readFile(new URL("../src/HomeScrambleText.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/styles.css", import.meta.url), "utf8")
  ]);

  assert.match(scrambleSource, /const \[lockedCount, setLockedCount\] = useState\(0\)/);
  assert.match(scrambleSource, /if \(index < lockedCount\)/);
  assert.match(scrambleSource, /index === lockedCount && activeCharacter !== null/);
  assert.doesNotMatch(scrambleSource, /getScrambledText/);
  assert.match(stylesheet, /\.iruka-entry-prompt > span \{[\s\S]*?width: 23ch;/);
  assert.match(stylesheet, /\.iruka-entry-stage \{[\s\S]*?width: clamp\(192px, 20vw, 252px\);/);
  assert.match(stylesheet, /@media \(max-width: 600px\) \{[\s\S]*?\.iruka-entry-stage \{[\s\S]*?width: 208px;/);
});

test("primary action styles use the Iruka blue glass treatment", async () => {
  const [stylesheet, beamSource, pixelUnfoldSource] = await Promise.all([
    readFile(new URL("../src/styles.css", import.meta.url), "utf8"),
    readFile(new URL("../src/IrukaBeam.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/HomePixelUnfold.tsx", import.meta.url), "utf8")
  ]);

  assert.match(stylesheet, /\.iruka-action-button/);
  assert.match(stylesheet, /rgba\(23, 111, 216, 0\.96\)/);
  assert.match(stylesheet, /border-top-color: rgba\(255, 255, 255, 0\.82\)/);
  assert.doesNotMatch(stylesheet, /border: 1px solid rgba\(255, 255, 255, 0\.64\);/);
  assert.match(stylesheet, /\.iruka-entry-action/);
  assert.match(stylesheet, /\.iruka-entry-stage \{[\s\S]*?border-radius: 50%;/);
  assert.match(pixelUnfoldSource, /import skyOcean from "\.\/assets\/iruka-entry-sky-ocean\.png"/);
  assert.doesNotMatch(stylesheet, /\.iruka-entry::before/);
  assert.doesNotMatch(stylesheet, /\.iruka-entry::after/);
  assert.match(stylesheet, /\.iruka-entry-action \{[\s\S]*?min-width: min\(214px, 76vw\);/);
  assert.match(
    stylesheet,
    /\.iruka-action-button,[\s\S]*?font-family:\s*var\(--font-sans\);/
  );
  assert.match(
    stylesheet,
    /\.iruka-entry-action \{[\s\S]*?font-weight:\s*600;/
  );
  assert.doesNotMatch(stylesheet, /font-family: Arial, Helvetica, sans-serif;/);
  assert.match(stylesheet, /backdrop-filter: blur\(12px\) saturate\(1\.25\);/);
  assert.match(stylesheet, /inset 0 1px 1px rgba\(255, 255, 255, 0\.42\)/);
  assert.match(stylesheet, /0 8px 16px rgba\(42, 117, 183, 0\.22\)/);
  assert.match(stylesheet, /\.iruka-beam-action\[data-active\][\s\S]*?background: transparent/);
  assert.match(stylesheet, /--beam-stroke-opacity: 1\.55/);
  assert.match(stylesheet, /--beam-bloom-opacity: 0\.78/);
  assert.match(beamSource, /duration: 6\.8/);
  assert.match(beamSource, /strength: 0\.42/);
  assert.match(beamSource, /theme: "dark" as const/);
  assert.doesNotMatch(stylesheet, /0 4px 0 rgba\(0, 70, 145, 0\.62\)/);
});
