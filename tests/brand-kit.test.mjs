import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const [
  typesSource,
  appSource,
  chromeSource,
  viewSource,
  styleSource,
  entrySource,
  mainSource,
  mainLogoAsset,
  mainLogoSvg,
  logomarkAsset,
  logomarkSvg,
  wordmarkAsset,
  wordmarkSvg,
  socialAvatarAsset
] =
  await Promise.all([
    readFile(new URL("../src/appTypes.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/App.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/AppChrome.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/BrandKitView.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/brand-kit.css", import.meta.url), "utf8"),
    readFile(new URL("../src/app-main.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/main.tsx", import.meta.url), "utf8"),
    readFile(new URL("../public/brand/iruka-main-logo.png", import.meta.url)),
    readFile(new URL("../public/brand/iruka-main-logo.svg", import.meta.url), "utf8"),
    readFile(new URL("../public/brand/iruka-logomark.png", import.meta.url)),
    readFile(new URL("../public/brand/iruka-logomark.svg", import.meta.url), "utf8"),
    readFile(new URL("../public/brand/iruka-wordmark.png", import.meta.url)),
    readFile(new URL("../public/brand/iruka-wordmark.svg", import.meta.url), "utf8"),
    readFile(new URL("../public/iruka-logo.png", import.meta.url))
  ]);

test("Brand Kit is an app view linked from the footer", () => {
  assert.match(typesSource, /"brand-kit"/);
  assert.match(appSource, /activeView === "brand-kit"/);
  assert.match(appSource, /<BrandKitView \/>/);
  assert.match(chromeSource, /onShowView\("brand-kit"\)/);
  assert.match(chromeSource, /copy\.links\.brandKit/);
});

test("Brand Kit exposes the supplied Iruka assets and palette", () => {
  assert.match(viewSource, /Main logo/);
  assert.match(viewSource, /Logomark/);
  assert.match(viewSource, /Wordmark/);
  for (const baseName of ["iruka-main-logo", "iruka-logomark", "iruka-wordmark"]) {
    assert.match(viewSource, new RegExp(baseName));
  }
  assert.match(viewSource, /format="PNG"/);
  assert.match(viewSource, /format="SVG"/);
  assert.doesNotMatch(viewSource, /2048|4096|1273/);
  assert.match(viewSource, /#1677FF/);
  assert.match(viewSource, /#20C7DF/);
  assert.match(viewSource, /#101828/);
  assert.match(viewSource, /Check, Copy, Download, X/);
  assert.match(viewSource, /brand-kit-guidance-icon-do/);
  assert.match(viewSource, /brand-kit-guidance-icon-avoid/);
  assert.match(viewSource, /clear space/i);
  assert.match(viewSource, /Do not stretch/i);
  assert.match(styleSource, /brand-kit-page/);
  assert.match(styleSource, /grid-template-columns: minmax\(0, 1fr\) minmax\(240px, 34ch\)/);
  assert.match(styleSource, /min-height: 2\.7em/);
  assert.match(styleSource, /white-space: nowrap/);
  assert.match(entrySource, /brand-kit\.css/);
});

test("the public Brand Kit remains directly accessible alongside the product", () => {
  assert.match(mainSource, /window\.location\.hash === "#brand-kit"/);
  assert.match(mainSource, /<BrandKitView \/>/);
  assert.doesNotMatch(mainSource, /if \(import\.meta\.env\.PROD\)/);
  assert.match(mainSource, /void import\("\.\/app-main"\)/);
});

test("Brand Kit downloads include transparent PNG and SVG formats", () => {
  const readPngHeader = (asset) => ({
    width: asset.readUInt32BE(16),
    height: asset.readUInt32BE(20),
    colorType: asset[25]
  });

  assert.deepEqual(readPngHeader(mainLogoAsset), {
    width: 4600,
    height: 1400,
    colorType: 6
  });
  assert.deepEqual(readPngHeader(logomarkAsset), {
    width: 2048,
    height: 2048,
    colorType: 6
  });
  assert.deepEqual(readPngHeader(wordmarkAsset), {
    width: 4096,
    height: 1273,
    colorType: 6
  });
  assert.deepEqual(readPngHeader(socialAvatarAsset), {
    width: 2048,
    height: 2048,
    colorType: 6
  });
  for (const svg of [mainLogoSvg, wordmarkSvg]) {
    assert.match(svg, /<svg /);
    assert.match(svg, /data:image\/png;base64,/);
  }
  assert.match(logomarkSvg, /<svg /);
  assert.match(logomarkSvg, /<path /);
  assert.match(logomarkSvg, /<linearGradient /);
  assert.doesNotMatch(logomarkSvg, /data:image\/png;base64,/);
});

test("web and Mintlify chrome use the new vector logomark", async () => {
  const [indexSource, docsConfigSource, docsLogomarkSvg] = await Promise.all([
    readFile(new URL("../index.html", import.meta.url), "utf8"),
    readFile(new URL("../docs/gitbook/docs.json", import.meta.url), "utf8"),
    readFile(
      new URL("../docs/gitbook/images/iruka-logomark.svg", import.meta.url),
      "utf8"
    )
  ]);
  const docsConfig = JSON.parse(docsConfigSource);

  assert.match(chromeSource, /src="\/brand\/iruka-logomark\.svg"/);
  assert.match(
    indexSource,
    /rel="icon" type="image\/svg\+xml" href="\/brand\/iruka-logomark\.svg"/
  );
  assert.equal(docsConfig.logo.light, "/images/iruka-logomark.svg");
  assert.equal(docsConfig.logo.dark, "/images/iruka-logomark.svg");
  assert.equal(docsConfig.favicon, "/images/iruka-logomark.svg");
  assert.equal(docsLogomarkSvg.trim(), logomarkSvg.trim());
});
