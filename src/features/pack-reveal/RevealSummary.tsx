import { ArrowRight, ExternalLink } from "lucide-react";
import type { RefObject } from "react";
import { RevealCard as RevealCardSurface } from "./RevealCard";
import { getRevealConfig, type RevealCard } from "./revealConfig";
import type { PackRevealLabels, RevealReceipt } from "./revealTypes";

type RevealSummaryProps = {
  card: RevealCard;
  continueButtonRef: RefObject<HTMLButtonElement>;
  labels: PackRevealLabels;
  onComplete: () => void;
  packTier: string;
  receipt?: RevealReceipt;
  reducedMotion: boolean;
};

export function RevealSummary({
  card,
  continueButtonRef,
  labels,
  onComplete,
  packTier,
  receipt,
  reducedMotion
}: RevealSummaryProps) {
  const config = getRevealConfig(card.rarity);

  return (
    <div className="pack-reveal-summary-scene">
      <div className="pack-reveal-summary-layout">
        <div className="pack-reveal-summary-card">
          <RevealCardSurface
            card={card}
            face="front"
            interactive
            reducedMotion={reducedMotion}
            revealed
          />
        </div>

        <aside aria-live="polite" className="pack-reveal-summary">
          <span className="pack-reveal-rarity">{config.name}</span>
          <h1>{card.name}</h1>
          <div className="pack-reveal-summary-meta">
            <div>
              <span>{labels.edition}</span>
              <strong>{packTier}</strong>
            </div>
            {card.serial ? (
              <div>
                <span>{labels.serial}</span>
                <strong>{card.serial}</strong>
              </div>
            ) : null}
          </div>
          {receipt ? (
            <a href={receipt.explorerUrl} rel="noreferrer" target="_blank">
              {labels.viewReceipt} #{receipt.requestId.toString()}
              <ExternalLink size={15} />
            </a>
          ) : null}
          <button
            className="pack-reveal-continue"
            onClick={onComplete}
            ref={continueButtonRef}
            type="button"
          >
            {labels.continue}
            <ArrowRight size={17} />
          </button>
        </aside>
      </div>
    </div>
  );
}
