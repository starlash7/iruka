import {
  ArrowRight,
  ExternalLink,
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
import { formatUsd } from "../../currency";
import { RevealCard } from "./RevealCard";
import { RevealEffects } from "./RevealEffects";
import { RevealTear, type RevealMedia } from "./RevealTear";
import { getRevealConfig, type RevealCard as RevealCardData } from "./revealConfig";
import { useRevealDialog } from "./useRevealDialog";
import {
  markRevealSeen,
  usePrefersReducedMotion
} from "./useRevealPreferences";
import { useRevealTimeline } from "./useRevealTimeline";

type PackRevealLabels = {
  continue: string;
  estimatedValue: string;
  skip: string;
  soundOff: string;
  soundOn: string;
  viewReceipt: string;
};

type RevealReceipt = {
  explorerUrl: string;
  requestId: bigint;
};

type PackRevealOverlayProps = {
  cards: RevealCardData[];
  labels: PackRevealLabels;
  media?: RevealMedia;
  onComplete: () => void;
  onSkip?: () => void;
  receipt?: RevealReceipt;
};

export function PackRevealOverlay({
  cards,
  labels,
  media,
  onComplete,
  onSkip,
  receipt
}: PackRevealOverlayProps) {
  const [muted, setMuted] = useState(true);
  const reducedMotion = usePrefersReducedMotion();
  const card = cards[0];
  const config = getRevealConfig(card.rarity);
  const completedRef = useRef(false);
  const seenRef = useRef(false);
  const skippedRef = useRef(false);
  const { isSummary, phase, skip } = useRevealTimeline({
    muted,
    quick: false,
    rarity: card.rarity,
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
      data-phase={phase}
      data-quick={false}
      data-rarity={card.rarity}
      onPointerDown={handleSkip}
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
        <RevealEffects phase={phase} />
        <RevealTear media={media} phase={phase} />
        <RevealCard
          card={card}
          reducedMotion={reducedMotion}
          revealed={phase === "reveal" || isSummary}
        />
      </div>

      <div className="pack-reveal-hud" onPointerDown={(event) => event.stopPropagation()}>
        <button
          aria-pressed={!muted}
          className="pack-reveal-sound"
          onClick={() => setMuted((value) => !value)}
          type="button"
        >
          {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          {muted ? labels.soundOff : labels.soundOn}
        </button>
        {!isSummary ? (
          <button className="pack-reveal-skip" onClick={handleSkip} type="button">
            <FastForward size={16} />
            {labels.skip}
          </button>
        ) : null}
      </div>

      {isSummary ? (
        <aside
          aria-live="polite"
          className="pack-reveal-summary"
          onPointerDown={(event) => event.stopPropagation()}
        >
          <span className="pack-reveal-rarity">{config.name}</span>
          <h1>{card.name}</h1>
          {card.serial ? <p>{card.serial}</p> : null}
          <div className="pack-reveal-summary-value">
            <span>{labels.estimatedValue}</span>
            <strong>{card.valueLabel ?? formatUsd(card.estimatedValue)}</strong>
          </div>
          {receipt ? (
            <a href={receipt.explorerUrl} rel="noreferrer" target="_blank">
              {labels.viewReceipt} #{receipt.requestId.toString()}
              <ExternalLink size={15} />
            </a>
          ) : null}
          <button
            className="pack-reveal-continue"
            onClick={complete}
            ref={continueButtonRef}
            type="button"
          >
            {labels.continue}
            <ArrowRight size={17} />
          </button>
        </aside>
      ) : null}
    </section>
  );
}
