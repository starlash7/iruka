import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { after, before, test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

let server;
let HomeImageCarousel;

before(async () => {
  server = await createServer({ appType: "custom", server: { middlewareMode: true } });
  ({ HomeImageCarousel } = await server.ssrLoadModule("/src/HomeImageCarousel.tsx"));
});

after(async () => {
  await server?.close();
});

test("home carousel removes duplicate slides and pagination dots", () => {
  const markup = renderToStaticMarkup(
    React.createElement(HomeImageCarousel, {
      images: ["idol-stage.png", "idol-stage.png", "idol-stage.png"],
      label: "Iruka"
    })
  );

  assert.equal((markup.match(/aria-roledescription="slide"/g) ?? []).length, 1);
  assert.match(markup, /aria-label="1 \/ 1"/);
  assert.equal((markup.match(/aria-current="true"/g) ?? []).length, 0);
});

test("home carousel keeps pagination for distinct slides", () => {
  const markup = renderToStaticMarkup(
    React.createElement(HomeImageCarousel, {
      images: ["idol-stage.png", "idol-vending.png"],
      label: "Iruka"
    })
  );

  assert.equal((markup.match(/aria-roledescription="slide"/g) ?? []).length, 2);
  assert.equal((markup.match(/aria-current="true"/g) ?? []).length, 1);
});

test("home view retains the single main carousel image", async () => {
  const source = await readFile(new URL("../src/HomeView.tsx", import.meta.url), "utf8");

  assert.match(source, /const homeImages = \[homeIdolStage\] as const;/);
});

test("home character motion is mouse-only and respects reduced motion", async () => {
  const [component, stylesheet] = await Promise.all([
    readFile(new URL("../src/HomeImageCarousel.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/styles.css", import.meta.url), "utf8")
  ]);

  assert.match(component, /onPointerMove=\{handlePointerMove\}/);
  assert.match(component, /event\.pointerType !== "mouse"/);
  assert.match(component, /prefers-reduced-motion: reduce/);
  assert.match(stylesheet, /\.home-character-motion\s*\{[\s\S]*?rotateX\(var\(--character-tilt-y\)\) rotateY\(var\(--character-tilt-x\)\)/);
  assert.match(stylesheet, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.home-character-motion/);
});
