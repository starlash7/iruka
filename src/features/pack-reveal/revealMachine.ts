export const REVEAL_OPEN_THRESHOLD = 0.72;
export const REDUCED_REVEAL_DURATION_MS = 300;

export const revealSceneOrder = [
  "sealed",
  "unpacking",
  "summary"
] as const;

export type RevealScene = (typeof revealSceneOrder)[number];
export const revealSequencePhaseOrder = [
  "sealed",
  "release",
  "dispensing",
  "opening",
  "extracting",
  "showcase"
] as const;

export type RevealSequencePhase = (typeof revealSequencePhaseOrder)[number];

export const REVEAL_SEQUENCE_TIMING = {
  dispensingAtMs: 600,
  extractingAtMs: 3500,
  nameAtMs: 6200,
  openingAtMs: 2000,
  rarityAtMs: 5600,
  showcaseAtMs: 8700,
  summaryAtMs: 9000
} as const;

export function getRevealSequenceDuration(reducedMotion: boolean) {
  return reducedMotion
    ? REDUCED_REVEAL_DURATION_MS
    : REVEAL_SEQUENCE_TIMING.summaryAtMs;
}

export function shouldCompleteRevealDrag(progress: number) {
  return progress >= REVEAL_OPEN_THRESHOLD;
}

export function getSkippedRevealScene(_scene: RevealScene): RevealScene {
  return "summary";
}
