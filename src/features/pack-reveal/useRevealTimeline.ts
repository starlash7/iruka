import { gsap } from "gsap";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getRevealConfig, type IrukaRarity, type RevealPhase } from "./revealConfig";
import { playRevealCue } from "./sounds";

type UseRevealTimelineArgs = {
  muted: boolean;
  onComplete: () => void;
  rarity: IrukaRarity;
  reducedMotion: boolean;
};

export function useRevealTimeline({
  muted,
  onComplete,
  rarity,
  reducedMotion
}: UseRevealTimelineArgs) {
  const config = useMemo(() => getRevealConfig(rarity), [rarity]);
  const [phase, setPhase] = useState<RevealPhase>("blackout");
  const [progress, setProgress] = useState(0);
  const completedRef = useRef(false);
  const mutedRef = useRef(muted);
  const onCompleteRef = useRef(onComplete);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const complete = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    setPhase("stamp");
    setProgress(1);
    onCompleteRef.current();
  }, []);

  useEffect(() => {
    completedRef.current = false;
    setPhase("blackout");
    setProgress(0);

    const duration = reducedMotion ? Math.min(1.2, config.duration) : config.duration;
    const timeline = gsap.timeline({
      onComplete: complete,
      onUpdate: () => setProgress(timeline.progress())
    });

    timeline.to({}, { duration, ease: "none" }, 0);

    for (const event of config.phaseEvents) {
      const at = reducedMotion
        ? Math.min((event.at / config.duration) * duration, duration * 0.9)
        : event.at;

      timeline.call(
        () => {
          setPhase(event.phase);
          playRevealCue(event.phase, mutedRef.current);
        },
        [],
        at
      );
    }

    timelineRef.current = timeline;

    return () => {
      timeline.kill();
      timelineRef.current = null;
    };
  }, [complete, config, reducedMotion]);

  const skip = useCallback(() => {
    if (completedRef.current) return;
    timelineRef.current?.kill();
    complete();
  }, [complete]);

  return {
    config,
    phase,
    progress,
    skip
  };
}
