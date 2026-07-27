import type { IrukaRarity } from "./revealConfig.ts";

export const revealPhaseOrder = [
  "idle",
  "charging",
  "tear",
  "reveal",
  "summary"
] as const;

export type RevealPhase = (typeof revealPhaseOrder)[number];

export type RevealEvent = {
  atMs: number;
  phase: Exclude<RevealPhase, "idle">;
};

export type RevealTimeline = {
  durationMs: number;
  events: readonly RevealEvent[];
};

type RevealTimelineOptions = {
  quick?: boolean;
  reducedMotion?: boolean;
};

const normalTimings: Record<
  IrukaRarity,
  { durationMs: number; revealAtMs: number; tearAtMs: number }
> = {
  common: { durationMs: 1500, tearAtMs: 400, revealAtMs: 900 },
  rare: { durationMs: 3000, tearAtMs: 480, revealAtMs: 1750 },
  epic: { durationMs: 3000, tearAtMs: 480, revealAtMs: 1750 },
  legendary: { durationMs: 4500, tearAtMs: 500, revealAtMs: 2800 },
  iruka: { durationMs: 4500, tearAtMs: 500, revealAtMs: 2800 }
};

export function getRevealTimeline(
  rarity: IrukaRarity,
  { quick = false, reducedMotion = false }: RevealTimelineOptions = {}
): RevealTimeline {
  if (reducedMotion) {
    const durationMs = quick ? 420 : 520;
    return createTimeline(durationMs, 80, 160);
  }

  if (quick) {
    const durationMs = rarity === "common" ? 650 : 900;
    return createTimeline(durationMs, 120, 280);
  }

  const { durationMs, revealAtMs, tearAtMs } = normalTimings[rarity];

  return createTimeline(durationMs, tearAtMs, revealAtMs);
}

export function getSkippedRevealPhase(_phase: RevealPhase): RevealPhase {
  return "summary";
}

function createTimeline(
  durationMs: number,
  tearAtMs: number,
  revealAtMs: number
): RevealTimeline {
  return {
    durationMs,
    events: [
      { atMs: 0, phase: "charging" },
      { atMs: tearAtMs, phase: "tear" },
      { atMs: revealAtMs, phase: "reveal" },
      { atMs: durationMs, phase: "summary" }
    ]
  };
}
