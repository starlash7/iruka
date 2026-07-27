import assert from "node:assert/strict";
import test from "node:test";
import {
  getRevealTimeline,
  getSkippedRevealPhase,
  revealPhaseOrder
} from "../src/features/pack-reveal/revealMachine.ts";

test("reveal follows the sprint state order", () => {
  const timeline = getRevealTimeline("rare");

  assert.deepEqual(
    ["idle", ...timeline.events.map((event) => event.phase)],
    revealPhaseOrder
  );
  assert.ok(timeline.events.find((event) => event.phase === "tear").atMs <= 500);
});

test("rarity timelines do not exceed their established maximum", () => {
  const maximums = {
    common: 1500,
    rare: 3000,
    epic: 3000,
    legendary: 4500,
    iruka: 4500
  } as const;

  for (const [rarity, maximum] of Object.entries(maximums)) {
    assert.ok(
      getRevealTimeline(rarity as keyof typeof maximums).durationMs <= maximum
    );
  }
});

test("default reveals preserve the approved anticipation and tear holds", () => {
  const expected = {
    common: [0, 400, 900, 1500],
    rare: [0, 480, 1750, 3000],
    epic: [0, 480, 1750, 3000],
    legendary: [0, 500, 2800, 4500],
    iruka: [0, 500, 2800, 4500]
  } as const;

  for (const [rarity, eventTimes] of Object.entries(expected)) {
    assert.deepEqual(
      getRevealTimeline(rarity as keyof typeof expected).events.map(
        (event) => event.atMs
      ),
      eventTimes
    );
  }
});

test("quick opening shortens a completed user's later reveal", () => {
  const normal = getRevealTimeline("legendary");
  const quick = getRevealTimeline("legendary", { quick: true });

  assert.ok(quick.durationMs < normal.durationMs);
  assert.deepEqual(
    quick.events.map((event) => event.phase),
    normal.events.map((event) => event.phase)
  );
});

test("reduced motion uses a short complete fallback", () => {
  const timeline = getRevealTimeline("iruka", { reducedMotion: true });

  assert.ok(timeline.durationMs <= 600);
  assert.equal(timeline.events.at(-1)?.phase, "summary");
});

test("skip reaches summary from every active phase", () => {
  for (const phase of revealPhaseOrder.slice(0, -1)) {
    assert.equal(getSkippedRevealPhase(phase), "summary");
  }
});
