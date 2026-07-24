import { ShieldCheck } from "lucide-react";
import type { MarketplaceItem } from "./marketplaceData";

type MarketplaceCardTileProps = {
  fmvLabel: string;
  item: MarketplaceItem;
  onOpen: (item: MarketplaceItem) => void;
  statusLabel: string;
  vaultLabel: string;
};

function MarketCard(props: MarketplaceCardTileProps) {
  const { fmvLabel, item, onOpen, statusLabel, vaultLabel } = props;
  const available = item.listing.status === "Available";

  return (
    <article className={`market-card rarity-${item.card.rarity.toLowerCase()}`}>
      <button
        aria-label={`${item.card.group} ${item.card.title}`}
        className="market-card-open"
        onClick={() => onOpen(item)}
        type="button"
      >
        <div className="market-card-art">
          <img alt="" loading="lazy" src={item.card.imageUrl} />
          {item.inventory.custodyVerified ? (
            <span className="market-vault-badge">
              <ShieldCheck size={12} />
              {vaultLabel}
            </span>
          ) : null}
          {!available ? <span className={`market-status-badge status-${item.listing.status.toLowerCase()}`}>{statusLabel}</span> : null}
        </div>
        <div className="market-card-copy">
          <span className="market-card-group">{item.card.group}</span>
          <strong>{item.card.title}</strong>
          <div className="market-card-fmv">
            <small>{fmvLabel}</small>
            <b>{`$${item.card.fmv}`}</b>
          </div>
        </div>
      </button>
    </article>
  );
}

export function MarketplaceCardTile(props: MarketplaceCardTileProps) {
  return <div className="market-card-cell"><MarketCard {...props} /></div>;
}
