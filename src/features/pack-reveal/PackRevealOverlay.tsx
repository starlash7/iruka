import {
  FastForward,
  Volume2,
  VolumeX
} from "lucide-react";
import {
  type CSSProperties,
  useCallback,
  useEffect,
  useRef,
  useState
} from "react";
import { getRevealConfig, type RevealCard } from "./revealConfig";
import { RevealSummary } from "./RevealSummary";
import type {
  PackRevealLabels,
  RevealMedia,
  RevealReceipt
} from "./revealTypes";
import { useRevealDialog } from "./useRevealDialog";
import {
  markRevealSeen,
  usePrefersReducedMotion
} from "./useRevealPreferences";
import { useRevealTimeline } from "./useRevealTimeline";
import { VendingRevealScene } from "./VendingRevealScene";

type PackRevealOverlayProps = {
  cards: RevealCard[];
  labels: PackRevealLabels;
  media?: RevealMedia;
  onComplete: () => void;
  onSkip?: () => void;
  packTier: string;
  receipt?: RevealReceipt;
  summaryOnly?: boolean;
};

export function PackRevealOverlay({
  cards,
  labels,
  media,
  onComplete,
  onSkip,
  packTier,
  receipt,
  summaryOnly = false
}: PackRevealOverlayProps) {
  const [muted, setMuted] = useState(true);
  const reducedMotion = usePrefersReducedMotion();
  const card = cards[0];
  const config = getRevealConfig(card.rarity);
  const completedRef = useRef(false);
  const seenRef = useRef(false);
  const skippedRef = useRef(false);
  const {
    finishUnpacking,
    isSummary,
    open,
    scene,
    skip
  } = useRevealTimeline({
    initialScene: summaryOnly ? "summary" : "sealed",
    muted,
    reducedMotion
  });
  const { continueButtonRef, overlayRef } = useRevealDialog(isSummary);

  const handleSkip = useCallback(() => {
    if (isSummary) return;
    if (!skippedRef.current) {
      skippedRef.current = true;
      onSkip?.();
    }
    skip();
  }, [isSummary, onSkip, skip]);

  const complete = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    if (!isSummary || seenRef.current) return;
    seenRef.current = true;
    markRevealSeen();
  }, [isSummary]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (isSummary) {
        complete();
      } else {
        handleSkip();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [complete, handleSkip, isSummary]);

  return (
    <section
      aria-label="Pack reveal"
      aria-modal="true"
      className="pack-reveal-overlay"
      data-rarity={card.rarity}
      data-scene={scene}
      ref={overlayRef}
      role="dialog"
      style={{
        "--reveal-accent": config.accent,
        "--reveal-foil": config.foil,
        "--reveal-spotlight": config.spotlight
      } as CSSProperties}
      tabIndex={-1}
    >
      <div className="pack-reveal-stage">
        {isSummary ? (
          <RevealSummary
            card={card}
            continueButtonRef={continueButtonRef}
            labels={labels}
            onComplete={complete}
            packTier={packTier}
            receipt={receipt}
            reducedMotion={reducedMotion}
          />
        ) : (
          <VendingRevealScene
            card={card}
            labels={labels}
            muted={muted}
            onFinish={finishUnpacking}
            onOpen={open}
            packImageUrl={media?.posterUrl}
            packTier={packTier}
            reducedMotion={reducedMotion}
            scene={scene}
          />
        )}
      </div>

      {!isSummary ? (
        <div className="pack-reveal-hud">
          <button
            aria-pressed={!muted}
            className="pack-reveal-sound"
            onClick={() => setMuted((value) => !value)}
            type="button"
          >
            {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            {muted ? labels.soundOff : labels.soundOn}
          </button>
          <button
            className="pack-reveal-skip"
            onClick={handleSkip}
            type="button"
          >
            <FastForward size={16} />
            {labels.skip}
          </button>
        </div>
      ) : null}
    </section>
  );
}
