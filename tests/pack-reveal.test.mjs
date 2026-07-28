import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readSource = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("pack reveal composes DOM tear, card, and summary surfaces", async () => {
  const source = await readSource("../src/features/pack-reveal/PackRevealOverlay.tsx");

  assert.match(source, /from "\.\/RevealCard"/);
  assert.match(source, /from "\.\/RevealEffects"/);
  assert.match(source, /from "\.\/RevealTear"/);
  assert.match(source, /<RevealEffects phase=\{phase\} \/>/);
  assert.match(source, /className="pack-reveal-summary"/);
  assert.match(source, /labels\.continue/);
  assert.doesNotMatch(source, /RevealScene/);
});

test("rarity stage effects are decorative, deterministic, and phase driven", async () => {
  const source = await readSource("../src/features/pack-reveal/RevealEffects.tsx");

  assert.match(source, /aria-hidden="true"/);
  assert.match(source, /className="pack-reveal-atmosphere"/);
  assert.match(source, /className="pack-reveal-burst"/);
  assert.match(source, /className="pack-reveal-rings"/);
  assert.match(source, /className="pack-reveal-rays"/);
  assert.match(source, /className="pack-reveal-particles"/);
  assert.match(source, /data-phase=\{phase\}/);
  assert.doesNotMatch(source, /Math\.random/);
});

test("rarity stage styles distinguish every tier and respect motion preferences", async () => {
  const source = (
    await Promise.all([
      readSource("../src/pack-reveal-effects.css"),
      readSource("../src/pack-reveal-responsive.css")
    ])
  ).join("\n");

  for (const rarity of ["common", "rare", "epic", "legendary", "iruka"]) {
    assert.match(source, new RegExp(`data-rarity="${rarity}"`));
  }
  assert.match(source, /@media \(max-width: 760px\)/);
  assert.match(source, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(source, /\.pack-reveal-particle:nth-child\(n \+ 11\)/);
});

test("tear media always has a preload and CSS failure fallback", async () => {
  const source = await readSource("../src/features/pack-reveal/RevealTear.tsx");

  assert.match(source, /preload="auto"/);
  assert.match(source, /onError=/);
  assert.match(source, /pack-reveal-tear-fallback/);
});

test("CSS pack opening includes a sealed foil shell, core light, and deterministic fragments", async () => {
  const source = await readSource("../src/features/pack-reveal/RevealTear.tsx");

  assert.match(source, /className="pack-reveal-pack-shell"/);
  assert.match(source, /className="pack-reveal-pack-foil"/);
  assert.match(source, /className="pack-reveal-pack-core"/);
  assert.match(source, /className="pack-reveal-seal-edge/);
  assert.match(source, /className="pack-reveal-fragments"/);
  assert.match(source, /packFragments\.map/);
  assert.doesNotMatch(source, /Math\.random/);
});

test("revealed card supports pointer glare and a flip state", async () => {
  const source = await readSource("../src/features/pack-reveal/RevealCard.tsx");

  assert.match(source, /onPointerMove=/);
  assert.match(source, /data-revealed=/);
  assert.match(source, /pack-reveal-card-aura/);
  assert.match(source, /pack-reveal-card-edge/);
  assert.match(source, /pack-reveal-card-foil/);
  assert.match(source, /pack-reveal-card-glare/);
  assert.match(source, /aria-hidden=\{!revealed\}/);
  assert.match(source, /disabled=\{!revealed\}/);
  assert.match(source, /tabIndex=\{revealed \? 0 : -1\}/);
});

test("pack and card motion styles include the premium rarity treatments", async () => {
  const [tearStyles, cardSource, responsiveStyles] = await Promise.all([
    readSource("../src/pack-reveal-tear.css"),
    readSource("../src/pack-reveal-card.css"),
    readSource("../src/pack-reveal-responsive.css")
  ]);
  const cardStyles = `${cardSource}\n${responsiveStyles}`;

  assert.match(tearStyles, /\.pack-reveal-pack-core/);
  assert.match(tearStyles, /\.pack-reveal-fragment/);
  assert.match(tearStyles, /data-phase="tear"[\s\S]*?pack-reveal-pack-top/);
  assert.match(cardStyles, /\.pack-reveal-card-aura/);
  assert.match(cardStyles, /\.pack-reveal-card-edge/);
  assert.match(cardStyles, /\.pack-reveal-card-foil/);
  assert.match(cardStyles, /data-rarity="legendary"/);
  assert.match(cardStyles, /data-rarity="iruka"/);
  assert.match(
    cardStyles,
    /data-rarity="common"\]\[data-phase="reveal"[\s\S]*?animation-duration:\s*520ms/
  );
  assert.match(cardStyles, /data-quick="true"[\s\S]*?animation-duration:/);
  assert.match(cardStyles, /@media \(prefers-reduced-motion: reduce\)/);
});

test("a reveal session keeps one timeline instead of restarting on prop changes", async () => {
  const source = await readSource("../src/features/pack-reveal/useRevealTimeline.ts");

  assert.match(source, /useState\(\(\) =>\s*getRevealTimeline/);
  assert.doesNotMatch(source, /useMemo\(/);
});

test("full reveal is the default and skip remains available", async () => {
  const source = await readSource("../src/features/pack-reveal/PackRevealOverlay.tsx");

  assert.doesNotMatch(source, /getRevealCount/);
  assert.match(source, /quick:\s*false/);
  assert.match(source, /data-quick=\{false\}/);
  assert.match(source, /\{!isSummary \? \(/);
  assert.doesNotMatch(source, /!isSummary && quick/);
});

test("reveal modal locks background scroll and manages keyboard focus", async () => {
  const [overlaySource, dialogSource] = await Promise.all([
    readSource("../src/features/pack-reveal/PackRevealOverlay.tsx"),
    readSource("../src/features/pack-reveal/useRevealDialog.ts")
  ]);

  assert.match(overlaySource, /useRevealDialog\(isSummary\)/);
  assert.match(overlaySource, /ref=\{overlayRef\}/);
  assert.match(overlaySource, /tabIndex=\{-1\}/);
  assert.match(dialogSource, /document\.body\.style\.overflow = "hidden"/);
  assert.match(dialogSource, /document\.body\.style\.overflow = previousOverflow/);
  assert.match(dialogSource, /continueButtonRef\.current\?\.focus/);
  assert.match(dialogSource, /\.inert = true/);
  assert.match(dialogSource, /event\.key !== "Tab"/);
});

test("reveal styles cover summary and reduced motion", async () => {
  const [stylesheets, copySource] = await Promise.all([
    Promise.all([
      "../src/pack-reveal.css",
      "../src/pack-reveal-effects.css",
      "../src/pack-reveal-tear.css",
      "../src/pack-reveal-card.css",
      "../src/pack-reveal-summary.css",
      "../src/pack-reveal-motion.css",
      "../src/pack-reveal-responsive.css"
    ].map(readSource)),
    readSource("../src/appCopy.ts")
  ]);
  const stylesheet = stylesheets.join("\n");

  assert.match(stylesheet, /\.pack-reveal-dom-card/);
  assert.match(stylesheet, /\.pack-reveal-summary/);
  assert.match(
    stylesheet,
    /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.pack-reveal-dom-card/
  );
  assert.match(copySource, /continue:\s*"Continue"/);
  assert.match(copySource, /continue:\s*"계속"/);
});

test("reveal layout includes transparency and narrow-mobile safeguards", async () => {
  const source = (
    await Promise.all([
      readSource("../src/pack-reveal.css"),
      readSource("../src/pack-reveal-summary.css"),
      readSource("../src/pack-reveal-responsive.css")
    ])
  ).join("\n");

  assert.match(source, /overscroll-behavior:\s*none/);
  assert.match(source, /max-height:\s*calc\(100dvh/);
  assert.match(source, /@media \(max-width: 390px\)/);
  assert.match(source, /@media \(prefers-reduced-transparency: reduce\)/);
});

test("reveal loading and chunk failures never leave a blank blocking overlay", async () => {
  const [appSource, boundarySource, stylesheet] = await Promise.all([
    readSource("../src/App.tsx"),
    readSource("../src/features/pack-reveal/PackRevealBoundary.tsx"),
    readSource("../src/pack-reveal.css")
  ]);

  assert.match(appSource, /<PackRevealBoundary/);
  assert.match(appSource, /<PackRevealLoading label=\{t\.hero\.opening\} \/>/);
  assert.doesNotMatch(appSource, /pack-reveal-loading" aria-hidden="true"/);
  assert.match(boundarySource, /getDerivedStateFromError/);
  assert.match(boundarySource, /role="dialog"/);
  assert.match(boundarySource, /onClick=\{onComplete\}/);
  assert.match(stylesheet, /\.pack-reveal-fallback/);
});
