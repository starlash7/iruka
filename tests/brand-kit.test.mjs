import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const [typesSource, appSource, chromeSource, viewSource, styleSource, entrySource, mainSource, markAsset, wordmarkAsset] =
  await Promise.all([
    readFile(new URL("../src/appTypes.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/App.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/AppChrome.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/BrandKitView.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/brand-kit.css", import.meta.url), "utf8"),
    readFile(new URL("../src/app-main.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/main.tsx", import.meta.url), "utf8"),
    readFile(new URL("../public/brand/iruka-mark.png", import.meta.url)),
    readFile(new URL("../public/brand/iruka-wordmark.png", import.meta.url))
  ]);

test("Brand Kit is an app view linked from the footer", () => {
  assert.match(typesSource, /"brand-kit"/);
  assert.match(appSource, /activeView === "brand-kit"/);
  assert.match(appSource, /<BrandKitView \/>/);
  assert.match(chromeSource, /onShowView\("brand-kit"\)/);
  assert.match(chromeSource, /copy\.links\.brandKit/);
});

test("Brand Kit exposes the supplied Iruka assets and palette", () => {
  assert.match(viewSource, /iruka-wordmark\.png/);
  assert.match(viewSource, /brand\/iruka-mark\.png/);
  assert.match(viewSource, /brand\/iruka-wordmark\.png/);
  assert.match(viewSource, /download=/);
  assert.match(viewSource, /#1677FF/);
  assert.match(viewSource, /#20C7DF/);
  assert.match(viewSource, /#101828/);
  assert.match(viewSource, /clear space/i);
  assert.match(viewSource, /Do not stretch/i);
  assert.match(styleSource, /brand-kit-page/);
  assert.match(entrySource, /brand-kit\.css/);
});

test("the public Brand Kit is the only production deep-link exception", () => {
  assert.match(mainSource, /window\.location\.hash === "#brand-kit"/);
  assert.match(mainSource, /<BrandKitView \/>/);
  assert.match(mainSource, /if \(import\.meta\.env\.PROD\)/);
  assert.match(mainSource, /<HomeEntry canEnter=\{false\}/);
  assert.match(mainSource, /void import\("\.\/app-main"\)/);
});

test("Brand Kit downloads use high-resolution transparent PNG masters", () => {
  const readPngHeader = (asset) => ({
    width: asset.readUInt32BE(16),
    height: asset.readUInt32BE(20),
    colorType: asset[25]
  });

  assert.deepEqual(readPngHeader(markAsset), {
    width: 2048,
    height: 2048,
    colorType: 6
  });
  assert.deepEqual(readPngHeader(wordmarkAsset), {
    width: 4096,
    height: 1273,
    colorType: 6
  });
});
