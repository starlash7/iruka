import { ArrowRight } from "lucide-react";
import { gsap } from "gsap";
import {
  type CSSProperties,
  useEffect,
  useLayoutEffect,
  useRef,
  useState
} from "react";
import { DispensedPack } from "./DispensedPack";
import { EmergingCard } from "./EmergingCard";
import {
  getRevealConfig,
  type RevealCard as RevealCardData
} from "./revealConfig";
import type {
  RevealScene,
  RevealSequencePhase
} from "./revealMachine";
import { runRevealSequenceAnimation } from "./revealSequenceAnimation";
import type { PackRevealLabels } from "./revealTypes";
import { useRevealDrag } from "./useRevealDrag";

type VendingRevealSceneProps = {
  card: RevealCardData;
  labels: PackRevealLabels;
  muted: boolean;
  onFinish: () => void;
  onOpen: () => void;
  packImageUrl?: string;
  packTier: string;
  reducedMotion: boolean;
  scene: RevealScene;
};

export function VendingRevealScene({
  card,
  labels,
  muted,
  onFinish,
  onOpen,
  packImageUrl,
  packTier,
  reducedMotion,
  scene
}: VendingRevealSceneProps) {
  const [phase, setPhase] = useState<RevealSequencePhase>("sealed");
  const mutedRef = useRef(muted);
  const drag = useRevealDrag(onOpen);
  const config = getRevealConfig(card.rarity);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  useLayoutEffect(() => {
    const root = drag.sceneRef.current;
    if (scene !== "unpacking" || !root) return;

    if (reducedMotion) {
      setPhase("showcase");
      gsap.set(root.querySelector(".pack-reveal-gesture-copy"), {
        autoAlpha: 0
      });
      return;
    }

    return runRevealSequenceAnimation({
      getMuted: () => mutedRef.current,
      onFinish,
      root,
      setPhase
    });
  }, [card.rarity, drag.sceneRef, onFinish, reducedMotion, scene]);

  return (
    <div
      className="pack-reveal-vending-scene"
      data-phase={phase}
      ref={drag.sceneRef}
      style={{
        "--drag-progress": 0,
        "--drag-x": "0px"
      } as CSSProperties}
    >
      <div className="pack-reveal-vending-product">
        <div className="pack-reveal-product-motion">
          <div className="pack-reveal-product-frame">
            <EmergingCard imageUrl={card.imageUrl} />
            <DispensedPack imageUrl={packImageUrl} />
          </div>
        </div>
        <div aria-live="polite" className="pack-reveal-reveal-meta">
          <span className="pack-reveal-reveal-rarity">{config.name}</span>
          <strong className="pack-reveal-reveal-name">{card.name}</strong>
        </div>
      </div>

      <div aria-hidden="true" className="pack-reveal-screen-wash" />

      <div className="pack-reveal-gesture-copy">
        <strong>{packTier}</strong>
        <div className="pack-reveal-drag-track" ref={drag.trackRef}>
          <span>{labels.slideToOpen}</span>
          <button
            aria-label={labels.slideToOpen}
            className="pack-reveal-drag-handle"
            disabled={scene !== "sealed"}
            onClick={drag.handleClick}
            onKeyDown={drag.handleKeyDown}
            onLostPointerCapture={drag.handleLostPointerCapture}
            onPointerCancel={drag.handlePointerCancel}
            onPointerDown={drag.handlePointerDown}
            onPointerMove={drag.handlePointerMove}
            onPointerUp={drag.handlePointerUp}
            type="button"
          >
            <ArrowRight aria-hidden="true" size={20} strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}
