import { useCallback, useEffect, useRef, useState } from "react";
import {
  getRevealSequenceDuration,
  type RevealScene
} from "./revealMachine";
import { playRevealCue } from "./sounds";

type UseRevealTimelineArgs = {
  initialScene?: RevealScene;
  muted: boolean;
  reducedMotion: boolean;
};

export function useRevealTimeline({
  initialScene = "sealed",
  muted,
  reducedMotion
}: UseRevealTimelineArgs) {
  const [scene, setScene] = useState<RevealScene>(initialScene);
  const sceneRef = useRef<RevealScene>(initialScene);
  const summaryTimerRef = useRef<number>();
  const mutedRef = useRef(muted);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  const clearSummaryTimer = useCallback(() => {
    window.clearTimeout(summaryTimerRef.current);
    summaryTimerRef.current = undefined;
  }, []);

  useEffect(() => clearSummaryTimer, [clearSummaryTimer]);

  const setRevealScene = useCallback((nextScene: RevealScene) => {
    sceneRef.current = nextScene;
    setScene(nextScene);
  }, []);

  const finishUnpacking = useCallback(() => {
    if (sceneRef.current !== "unpacking") return;
    clearSummaryTimer();
    setRevealScene("summary");
    playRevealCue("summary", mutedRef.current);
  }, [clearSummaryTimer, setRevealScene]);

  const open = useCallback(() => {
    if (sceneRef.current !== "sealed") return;
    setRevealScene("unpacking");
    playRevealCue("unpacking", mutedRef.current);

    if (!reducedMotion) return;
    summaryTimerRef.current = window.setTimeout(
      finishUnpacking,
      getRevealSequenceDuration(true)
    );
  }, [finishUnpacking, reducedMotion, setRevealScene]);

  const skip = useCallback(() => {
    if (sceneRef.current === "summary") return;
    clearSummaryTimer();
    setRevealScene("summary");
    playRevealCue("summary", mutedRef.current);
  }, [clearSummaryTimer, setRevealScene]);

  return {
    finishUnpacking,
    isSummary: scene === "summary",
    open,
    scene,
    skip
  };
}
