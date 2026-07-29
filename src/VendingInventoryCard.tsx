import { RefreshCw } from "lucide-react";
import { useState } from "react";
import type { InventoryCard, RarityTier } from "./vendingTypes";

type VendingInventoryCardProps = {
  card: InventoryCard;
  copy: {
    redeemable: string;
    viewBack: string;
    viewFront: string;
  };
  rarityLabel: string;
};

export function VendingInventoryCard({
  card,
  copy,
  rarityLabel
}: VendingInventoryCardProps) {
  const [showBack, setShowBack] = useState(false);
  const hasDistinctBack = card.media.backUrl !== card.media.frontUrl;
  const imageUrl = showBack ? card.media.backUrl : card.media.frontUrl;
  const flipLabel = showBack ? copy.viewFront : copy.viewBack;
  const verification = [card.grade, card.certificateId, card.verificationId].filter(Boolean);

  return (
    <article className={`vending-inventory-card rarity-${card.tier.toLowerCase()}`}>
      <div className="vending-inventory-media">
        <img alt={card.title} loading="lazy" src={imageUrl} />
        {hasDistinctBack ? (
          <button
            aria-label={`${flipLabel}: ${card.title}`}
            className="vending-card-flip"
            onClick={() => setShowBack((value) => !value)}
            title={flipLabel}
            type="button"
          >
            <RefreshCw aria-hidden="true" size={15} />
          </button>
        ) : null}
      </div>
      <div className="vending-inventory-copy">
        <div>
          <span className={`vending-card-rarity rarity-${card.tier.toLowerCase()}`}>
            {rarityLabel}
          </span>
          {card.redemption.eligible ? <small>{copy.redeemable}</small> : null}
        </div>
        <strong>{card.title}</strong>
        <p className="vending-card-facts">{card.serial}</p>
        {verification.length > 0 ? <p>{verification.join(" · ")}</p> : null}
      </div>
    </article>
  );
}

export type InventoryRarityLabels = Record<RarityTier, string>;
