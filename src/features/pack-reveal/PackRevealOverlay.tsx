import {
  Component,
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState
} from "react";
import { formatUsd } from "../../currency";
import { RevealScene } from "./RevealScene";
import { getRevealConfig, type RevealCard } from "./revealConfig";
import { useRevealTimeline } from "./useRevealTimeline";

type PackRevealLabels = {
  estimatedValue: string;
  skip: string;
  soundOff: string;
  soundOn: string;
};

type PackRevealOverlayProps = {
  cards: RevealCard[];
  labels: PackRevealLabels;
  onComplete: () => void;
  onSkip?: () => void;
};

type RevealErrorBoundaryProps = {
  children: ReactNode;
  onError: () => void;
};

class RevealErrorBoundary extends Component<RevealErrorBoundaryProps, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

function canUseWebGL() {
  if (typeof document === "undefined") return false;

  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

function usePrefersReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(() =>
    typeof window === "undefined" ? false : window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);

    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return reducedMotion;
}

function getRevealCount() {
  try {
    return Number(window.localStorage.getItem("iruka-reveal-count") ?? "0");
  } catch {
    return 0;
  }
}

function markRevealSeen() {
  try {
    window.localStorage.setItem("iruka-reveal-count", String(getRevealCount() + 1));
  } catch {
    // A blocked storage write should not block the pack result.
  }
}

function RevealFallback({
  card,
  labels,
  phase
}: {
  card: RevealCard;
  labels: PackRevealLabels;
  phase: string;
}) {
  const config = getRevealConfig(card.rarity);

  return (
    <div className="pack-reveal-fallback" data-phase={phase}>
      <div className="pack-reveal-slot" />
      <article className="pack-reveal-card-fallback" style={{ "--reveal-accent": config.accent } as CSSProperties}>
        <img alt="" src={card.imageUrl} />
      </article>
      <div className="pack-reveal-stamp" style={{ "--reveal-accent": config.accent } as CSSProperties}>
        {config.name}
      </div>
      <div className="pack-reveal-value">
        <span>{labels.estimatedValue}</span>
        <strong>{formatUsd(card.estimatedValue)}</strong>
      </div>
    </div>
  );
}

export function PackRevealOverlay({
  cards,
  labels,
  onComplete,
  onSkip
}: PackRevealOverlayProps) {
  const [muted, setMuted] = useState(true);
  const [sceneFailed, setSceneFailed] = useState(false);
  const [showSkipHint] = useState(() => getRevealCount() > 0);
  const [webglReady] = useState(canUseWebGL);
  const completeRef = useRef(false);
  const skippedRef = useRef(false);
  const reducedMotion = usePrefersReducedMotion();
  const card = cards[0];
  const config = getRevealConfig(card.rarity);
  const complete = useCallback(() => {
    if (completeRef.current) return;
    completeRef.current = true;
    markRevealSeen();

    if (skippedRef.current) {
      onSkip?.();
    }

    onComplete();
  }, [onComplete, onSkip]);
  const { phase, progress, skip } = useRevealTimeline({
    muted,
    onComplete: complete,
    rarity: card.rarity,
    reducedMotion: reducedMotion || sceneFailed || !webglReady
  });
  const useFallback = reducedMotion || sceneFailed || !webglReady;
  const handleSkip = useCallback(() => {
    skippedRef.current = true;
    skip();
  }, [skip]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleSkip();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [handleSkip]);

  return (
    <section
      aria-label="Pack reveal"
      aria-modal="true"
      className="pack-reveal-overlay"
      data-phase={phase}
      data-rarity={card.rarity}
      onPointerDown={handleSkip}
      role="dialog"
      style={{ "--reveal-accent": config.accent, "--reveal-foil": config.foil } as CSSProperties}
    >
      <div className="pack-reveal-scene" aria-hidden="true">
        {useFallback ? (
          <RevealFallback card={card} labels={labels} phase={phase} />
        ) : (
          <RevealErrorBoundary onError={() => setSceneFailed(true)}>
            <RevealScene
              card={card}
              phase={phase}
              progress={progress}
              reducedMotion={reducedMotion}
            />
          </RevealErrorBoundary>
        )}
      </div>

      <div className="pack-reveal-hud" onPointerDown={(event) => event.stopPropagation()}>
        <button
          aria-pressed={!muted}
          className="pack-reveal-sound"
          onClick={() => setMuted((value) => !value)}
          type="button"
        >
          {muted ? labels.soundOff : labels.soundOn}
        </button>
        {showSkipHint ? <button className="pack-reveal-skip" onClick={handleSkip} type="button">{labels.skip}</button> : null}
      </div>

      <div className="pack-reveal-result" aria-live="polite" onPointerDown={(event) => event.stopPropagation()}>
        <span>{config.name}</span>
        <strong>{card.name}</strong>
        {card.serial ? <small>{card.serial}</small> : null}
      </div>
    </section>
  );
}
