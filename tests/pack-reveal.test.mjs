import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readSource = (path) => readFile(new URL(path, import.meta.url), "utf8");
const readOptionalSource = (path) => readSource(path).catch(() => "");

test("pack reveal mounts one vending sequence until summary", async () => {
  const [
    overlaySource,
    sequenceSource,
    packSource,
    emergingCardSource
  ] = await Promise.all([
    readSource("../src/features/pack-reveal/PackRevealOverlay.tsx"),
    readOptionalSource("../src/features/pack-reveal/VendingRevealScene.tsx"),
    readOptionalSource("../src/features/pack-reveal/DispensedPack.tsx"),
    readOptionalSource("../src/features/pack-reveal/EmergingCard.tsx")
  ]);
  const revealSource = [
    sequenceSource,
    packSource,
    emergingCardSource
  ].join("\n");

  assert.match(overlaySource, /<VendingRevealScene/);
  assert.match(overlaySource, /<RevealSummary/);
  assert.match(overlaySource, /isSummary \?/);
  assert.doesNotMatch(overlaySource, /switch \(scene\)/);
  assert.doesNotMatch(overlaySource, /RevealCinematicScene/);
  assert.doesNotMatch(overlaySource, /RevealCardScene/);
  assert.doesNotMatch(sequenceSource, /VendingSlot/);
  assert.match(sequenceSource, /<DispensedPack/);
  assert.match(sequenceSource, /<EmergingCard/);
  assert.equal((sequenceSource.match(/<EmergingCard/g) ?? []).length, 1);
  assert.match(sequenceSource, /imageUrl=\{card\.imageUrl\}/);
  assert.match(packSource, /pack-reveal-pack-body/);
  assert.match(packSource, /pack-reveal-pack-seal/);
  assert.match(emergingCardSource, /pack-reveal-emerging-card/);
  assert.match(emergingCardSource, /src=\{imageUrl\}/);
  assert.match(emergingCardSource, /<img/);
  assert.doesNotMatch(revealSource, /RevealReceipt/);
  assert.doesNotMatch(revealSource, /RevealFullPhoto/);
  assert.doesNotMatch(revealSource, /pack-reveal-receipt/);
  assert.doesNotMatch(revealSource, /pack-reveal-full-photo/);
  assert.match(sequenceSource, /data-phase=\{phase\}/);
});

test("seal gesture updates CSS progress without React pointer renders", async () => {
  const source = (
    await Promise.all([
      readOptionalSource("../src/features/pack-reveal/VendingRevealScene.tsx"),
      readSource("../src/features/pack-reveal/useRevealDrag.ts")
    ])
  ).join("\n");

  assert.match(source, /setPointerCapture/);
  assert.match(source, /releasePointerCapture/);
  assert.match(source, /onPointerCancel=/);
  assert.match(source, /requestAnimationFrame/);
  assert.match(source, /--drag-progress/);
  assert.match(source, /shouldCompleteRevealDrag/);
  assert.match(source, /event\.key === "Enter"/);
  assert.match(source, /event\.key === " "/);

  const releasePointer = source.slice(
    source.indexOf("function releasePointer"),
    source.indexOf("function handlePointerDown")
  );
  assert.ok(
    releasePointer.indexOf("dragRef.current.active = false")
      < releasePointer.indexOf("releasePointerCapture"),
    "pointer capture must become inactive before lostpointercapture can fire"
  );
});

test("pack and card preserve complete artwork inside normalized frames", async () => {
  const styles = (
    await Promise.all([
      readSource("../src/pack-reveal-tear.css"),
      readSource("../src/pack-reveal-vending-product.css"),
      readSource("../src/pack-reveal-card.css")
    ])
  ).join("\n");

  assert.match(styles, /\.pack-reveal-product-frame/);
  assert.match(styles, /\.pack-reveal-pack-body[\s\S]*?overflow:\s*hidden/);
  assert.match(styles, /\.pack-reveal-pack-body img[\s\S]*?object-fit:\s*contain/);
  assert.match(styles, /\.pack-reveal-pack-seal img[\s\S]*?object-fit:\s*contain/);
  assert.match(styles, /\.pack-reveal-emerging-card[\s\S]*?aspect-ratio:\s*3\s*\/\s*4/);
  assert.match(styles, /\.pack-reveal-emerging-card img[\s\S]*?object-fit:\s*contain/);
  assert.match(styles, /\.pack-reveal-card-front img[\s\S]*?object-fit:\s*contain/);
  assert.doesNotMatch(styles, /\.pack-reveal-receipt/);
  assert.doesNotMatch(styles, /\.pack-reveal-full-photo/);
});

test("sealed pack is centered without a vending gauge or crop mask", async () => {
  const [sequenceSource, styles, productStyles] = await Promise.all([
    readSource("../src/features/pack-reveal/VendingRevealScene.tsx"),
    readSource("../src/pack-reveal-tear.css"),
    readSource("../src/pack-reveal-vending-product.css")
  ]);

  assert.doesNotMatch(sequenceSource, /VendingSlot/);
  assert.doesNotMatch(styles, /\.pack-reveal-vending-slot/);
  assert.doesNotMatch(styles, /--slot-clearance/);
  assert.match(
    styles,
    /\.pack-reveal-product-frame[\s\S]*?overflow:\s*visible/
  );
  assert.match(
    productStyles,
    /\.pack-reveal-dispensed-pack[\s\S]*?--pack-drop:\s*-18%/
  );
});

test("unpacking uses the existing pack art without loading a video", async () => {
  const [appSource, overlaySource, mediaTypes] = await Promise.all([
    readSource("../src/App.tsx"),
    readSource("../src/features/pack-reveal/PackRevealOverlay.tsx"),
    readSource("../src/features/pack-reveal/revealTypes.ts")
  ]);

  assert.match(appSource, /posterUrl: selectedPackDetail\.media\.packFrontUrl/);
  assert.match(appSource, /packTier=\{selectedPackDetail\.tier\}/);
  assert.doesNotMatch(appSource, /pack-closeup-portrait\.mp4/);
  assert.doesNotMatch(overlaySource, /useRevealMediaPreload/);
  assert.doesNotMatch(mediaTypes, /VideoUrl/);
});

test("summary owns edition, serial, and rarity metadata", async () => {
  const [overlaySource, source] = await Promise.all([
    readSource("../src/features/pack-reveal/PackRevealOverlay.tsx"),
    readSource("../src/features/pack-reveal/RevealSummary.tsx")
  ]);

  assert.match(overlaySource, /packTier=\{packTier\}/);
  assert.match(source, /packTier:\s*string/);
  assert.match(source, /labels\.edition/);
  assert.match(source, /labels\.serial/);
  assert.match(source, /config\.name/);
  assert.doesNotMatch(source, /grade/i);
  assert.doesNotMatch(source, /year/i);
});

test("the pulled card rises from the pack and summary stays interactive", async () => {
  const [sequenceSource, emergingCardSource, cardSource, cardStyles] = await Promise.all([
    readOptionalSource("../src/features/pack-reveal/VendingRevealScene.tsx"),
    readOptionalSource("../src/features/pack-reveal/EmergingCard.tsx"),
    readSource("../src/features/pack-reveal/RevealCard.tsx"),
    readSource("../src/pack-reveal-card.css")
  ]);

  assert.doesNotMatch(sequenceSource, /<RevealCard/);
  assert.equal((sequenceSource.match(/<EmergingCard/g) ?? []).length, 1);
  assert.match(sequenceSource, /imageUrl=\{card\.imageUrl\}/);
  assert.match(emergingCardSource, /src=\{imageUrl\}/);
  assert.match(emergingCardSource, /onError=/);
  assert.match(emergingCardSource, /pack-reveal-emerging-card-fallback/);
  assert.match(sequenceSource, /data-phase=\{phase\}/);
  assert.match(cardSource, /face:\s*"back" \| "front"/);
  assert.match(cardSource, /onPointerMove=/);
  assert.match(cardSource, /onError=/);
  assert.match(cardSource, /pack-reveal-card-foil/);
  assert.match(cardSource, /pack-reveal-card-image-fallback/);
  assert.match(cardSource, /interactive:\s*boolean/);
  assert.match(cardStyles, /\[data-back="false"\]/);
  assert.match(
    cardStyles,
    /\.pack-reveal-dom-card[\s\S]*?aspect-ratio:\s*3\s*\/\s*4/
  );
  assert.match(
    cardStyles,
    /\.pack-reveal-card-front img[\s\S]*?object-fit:\s*contain/
  );
  assert.doesNotMatch(cardStyles, /\[data-face="front"\]/);
});

test("GSAP sequence dispenses one pack and extracts one card without rotation", async () => {
  const source = (
    await Promise.all([
      readOptionalSource(
        "../src/features/pack-reveal/VendingRevealScene.tsx"
      ),
      readOptionalSource(
        "../src/features/pack-reveal/revealSequenceAnimation.ts"
      )
    ])
  ).join("\n");

  assert.match(source, /import \{ gsap \} from "gsap"/);
  assert.match(source, /gsap\.context/);
  assert.match(source, /REVEAL_SEQUENCE_TIMING/);
  assert.match(source, /dispensingAtMs/);
  assert.match(source, /openingAtMs/);
  assert.match(source, /extractingAtMs/);
  assert.match(source, /rarityAtMs/);
  assert.match(source, /nameAtMs/);
  assert.match(source, /showcaseAtMs/);
  assert.match(source, /summaryAtMs/);
  for (const selector of [
    "pack-reveal-dispensed-pack",
    "pack-reveal-pack-seal",
    "pack-reveal-pack-mouth",
    "pack-reveal-emerging-card",
    "pack-reveal-reveal-rarity",
    "pack-reveal-reveal-name",
    "pack-reveal-screen-wash"
  ]) {
    assert.match(source, new RegExp(selector));
  }
  assert.match(source, /context\.revert\(\)/);
  assert.doesNotMatch(source, /rotationX/);
  assert.doesNotMatch(source, /rotationY/);
  assert.doesNotMatch(source, /rotationZ/);
  assert.doesNotMatch(source, /rotation:/);
  assert.doesNotMatch(source, /scaleY/);
  assert.doesNotMatch(source, /<video/);
  assert.doesNotMatch(source, /pack-reveal-vending-slot/);
});

test("the opened pack remains until the final wash masks the summary handoff", async () => {
  const [animationSource, styles] = await Promise.all([
    readSource("../src/features/pack-reveal/revealSequenceAnimation.ts"),
    readSource("../src/pack-reveal-tear.css")
  ]);

  assert.match(animationSource, /"--pack-drop": "-18%"/);
  assert.match(animationSource, /"--card-rise": "-78%"/);
  assert.doesNotMatch(
    animationSource,
    /pack-reveal-dispensed-pack[\s\S]{0,220}autoAlpha:\s*0[\s\S]{0,100}yPercent:\s*18/
  );
  assert.match(
    animationSource,
    /pack-reveal-screen-wash[\s\S]*?summaryAtMs\)\s*-\s*0\.3/
  );
  assert.equal(
    (animationSource.match(/\.to\(\s*"\.pack-reveal-screen-wash"/g) ?? []).length,
    1
  );
  assert.doesNotMatch(animationSource, /top:\s*"50%"/);
  assert.doesNotMatch(
    styles,
    /\[data-phase="showcase"\][\s\S]*?\.pack-reveal-emerging-card[\s\S]*?top:\s*50%/
  );
});

test("skip and reduced motion finish the persistent sequence once", async () => {
  const source = await readSource(
    "../src/features/pack-reveal/useRevealTimeline.ts"
  );

  assert.match(source, /getRevealSequenceDuration/);
  assert.match(source, /sceneRef\.current !== "unpacking"/);
  assert.match(source, /window\.clearTimeout/);
  assert.match(source, /setRevealScene\("summary"\)/);
  assert.doesNotMatch(source, /finishCinematic/);
});

test("summary is a separate flow layout and preserves receipt and completion", async () => {
  const source = await readSource(
    "../src/features/pack-reveal/RevealSummary.tsx"
  );
  const styles = await readSource("../src/pack-reveal-summary.css");

  assert.match(source, /className="pack-reveal-summary-layout"/);
  assert.match(source, /labels\.viewReceipt/);
  assert.match(source, /labels\.continue/);
  assert.match(styles, /\.pack-reveal-summary-layout/);
  assert.doesNotMatch(styles, /position:\s*absolute/);
  assert.doesNotMatch(styles, /translate3d/);
});

test("reveal modal keeps focus, explicit skip, and muted sound controls", async () => {
  const [overlaySource, dialogSource] = await Promise.all([
    readSource("../src/features/pack-reveal/PackRevealOverlay.tsx"),
    readSource("../src/features/pack-reveal/useRevealDialog.ts")
  ]);

  assert.match(overlaySource, /useRevealDialog\(isSummary\)/);
  assert.match(overlaySource, /ref=\{overlayRef\}/);
  assert.match(overlaySource, /tabIndex=\{-1\}/);
  assert.match(overlaySource, /labels\.skip/);
  assert.match(overlaySource, /labels\.soundOff/);
  assert.match(dialogSource, /document\.body\.style\.overflow = "hidden"/);
  assert.match(dialogSource, /continueButtonRef\.current\?\.focus/);
});

test("reveal styles are feature-owned with no legacy global selectors", async () => {
  const [mainSource, globalStyles, stylesheets] = await Promise.all([
    readSource("../src/main.tsx"),
    readSource("../src/styles.css"),
    Promise.all([
      "../src/pack-reveal.css",
      "../src/pack-reveal-tear.css",
      "../src/pack-reveal-vending-product.css",
      "../src/pack-reveal-gesture.css",
      "../src/pack-reveal-card.css",
      "../src/pack-reveal-summary.css",
      "../src/pack-reveal-motion.css",
      "../src/pack-reveal-responsive.css"
    ].map(readSource))
  ]);
  const stylesheet = stylesheets.join("\n");

  assert.doesNotMatch(mainSource, /pack-reveal-effects\.css/);
  assert.match(mainSource, /pack-reveal-gesture\.css/);
  assert.doesNotMatch(globalStyles, /\.pack-reveal-overlay/);
  assert.match(stylesheet, /\.pack-reveal-vending-scene/);
  assert.doesNotMatch(stylesheet, /\.pack-reveal-vending-slot/);
  assert.match(stylesheet, /\.pack-reveal-dispensed-pack/);
  assert.match(stylesheet, /\.pack-reveal-pack-seal/);
  assert.match(stylesheet, /\.pack-reveal-emerging-card/);
  assert.match(stylesheet, /\.pack-reveal-screen-wash/);
  assert.match(stylesheet, /\.pack-reveal-summary-layout/);
  assert.doesNotMatch(stylesheet, /\.pack-reveal-receipt/);
  assert.doesNotMatch(stylesheet, /\.pack-reveal-full-photo/);
  assert.doesNotMatch(stylesheet, /\.pack-reveal-ticket/);
  assert.doesNotMatch(stylesheet, /\.pack-reveal-sequence-card/);
  assert.doesNotMatch(stylesheet, /\.pack-reveal-result-title/);
  assert.doesNotMatch(stylesheet, /\.pack-reveal-sequence-mouth/);
  assert.doesNotMatch(stylesheet, /\.pack-reveal-sequence-pack-half/);
  assert.doesNotMatch(stylesheet, /\.pack-reveal-hints/);
  assert.doesNotMatch(stylesheet, /\.pack-reveal-sequence-glow/);
  assert.doesNotMatch(stylesheet, /\.pack-reveal-cinematic/);
});

test("reveal layout covers mobile, reduced motion, and transparency preferences", async () => {
  const source = (
    await Promise.all([
      readSource("../src/pack-reveal.css"),
      readSource("../src/pack-reveal-tear.css"),
      readSource("../src/pack-reveal-summary.css"),
      readSource("../src/pack-reveal-responsive.css")
    ])
  ).join("\n");

  assert.match(source, /overscroll-behavior:\s*none/);
  assert.match(source, /min\(58dvh,\s*560px\)/);
  assert.match(source, /min\(52dvh,\s*440px\)/);
  assert.match(source, /@media \(max-width: 760px\)/);
  assert.match(source, /@media \(max-width: 390px\)/);
  assert.match(source, /@media \(prefers-reduced-motion: reduce\)/);
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
  assert.match(boundarySource, /getDerivedStateFromError/);
  assert.match(boundarySource, /onClick=\{onComplete\}/);
  assert.match(stylesheet, /\.pack-reveal-fallback/);
});
