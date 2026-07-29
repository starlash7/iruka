import assert from "node:assert/strict";
import test from "node:test";
import * as revealMachine from "../src/features/pack-reveal/revealMachine.ts";

const {
  getRevealSequenceDuration,
  getSkippedRevealScene,
  REVEAL_OPEN_THRESHOLD,
  REVEAL_SEQUENCE_TIMING,
  revealSequencePhaseOrder,
  revealSceneOrder,
  shouldCompleteRevealDrag
} = revealMachine;

test("reveal keeps one unpacking scene before summary", () => {
  assert.deepEqual(revealSceneOrder, [
    "sealed",
    "unpacking",
    "summary"
  ]);
});

test("drag completes only at the 72 percent seal threshold", () => {
  assert.equal(REVEAL_OPEN_THRESHOLD, 0.72);
  assert.equal(shouldCompleteRevealDrag(0.719), false);
  assert.equal(shouldCompleteRevealDrag(0.72), true);
  assert.equal(shouldCompleteRevealDrag(1), true);
});

test("unpacking publishes the vending dispense reveal contract", () => {
  assert.deepEqual(revealSequencePhaseOrder, [
    "sealed",
    "release",
    "dispensing",
    "opening",
    "extracting",
    "showcase"
  ]);
  assert.deepEqual(REVEAL_SEQUENCE_TIMING, {
    dispensingAtMs: 600,
    extractingAtMs: 3500,
    nameAtMs: 6200,
    openingAtMs: 2000,
    rarityAtMs: 5600,
    showcaseAtMs: 8700,
    summaryAtMs: 9000
  });
  assert.equal(getRevealSequenceDuration(false), 9000);
});

test("reduced motion uses a short static-card transition", () => {
  assert.equal(typeof getRevealSequenceDuration, "function");
  assert.equal(getRevealSequenceDuration(true), 300);
});

test("skip reaches summary from every active scene", () => {
  for (const scene of revealSceneOrder.slice(0, -1)) {
    assert.equal(getSkippedRevealScene(scene), "summary");
  }
});
