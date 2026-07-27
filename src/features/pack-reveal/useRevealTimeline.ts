import { useCallback, useEffect, useRef, useState } from "react";
import type { IrukaRarity } from "./revealConfig";
import {
  getRevealTimeline,
  type RevealPhase
} from "./revealMachine";
import { playRevealCue } from "./sounds";

type UseRevealTimelineArgs = {
  muted: boolean;
  quick: boolean;
  rarity: IrukaRarity;
  reducedMotion: boolean;
};

export function useRevealTimeline({
  muted,
  quick,
  rarity,
  reducedMotion
}: UseRevealTimelineArgs) {
  const [timeline] = useState(() =>
    getRevealTimeline(rarity, { quick, reducedMotion })
  );
  const [phase, setPhase] = useState<RevealPhase>("idle");
  const timersRef = useRef<number[]>([]);
  const mutedRef = useRef(muted);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  const clearTimers = useCallback(() => {
    for (const timer of timersRef.current) window.clearTimeout(timer);
    timersRef.current = [];
  }, []);

  useEffect(() => {
    clearTimers();
    setPhase("idle");

    timersRef.current = timeline.events.map(({ atMs, phase: nextPhase }) =>
      window.setTimeout(() => {
        setPhase(nextPhase);
        playRevealCue(nextPhase, mutedRef.current);
      }, atMs)
    );

    return clearTimers;
  }, [clearTimers, timeline]);

  const skip = useCallback(() => {
    clearTimers();
    setPhase("summary");
    playRevealCue("summary", mutedRef.current);
  }, [clearTimers]);

  return {
    isSummary: phase === "summary",
    phase,
    skip
  };
}
