import { ShieldCheck } from "lucide-react";
import { formatUsd } from "./currency";
import { getMarketplaceSaleRange, type MarketplaceItem } from "./marketplaceData";
import {
  getMarketplaceCardTypeLabel,
  type MarketplaceLocale
} from "./marketplaceFilters";

type MarketplaceCardTileProps = {
  buyLabel: string;
  item: MarketplaceItem;
  locale: MarketplaceLocale;
  onBuy: (item: MarketplaceItem) => void;
  onOpen: (item: MarketplaceItem) => void;
  recentLabel: string;
  statusLabel: string;
  vaultLabel: string;
};

function MarketCard(props: MarketplaceCardTileProps) {
  const { buyLabel, item, locale, onBuy, onOpen, recentLabel, statusLabel, vaultLabel } = props;
  const available = item.listing.status === "Available";
  const saleRange = getMarketplaceSaleRange(item.sales);

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
          <span className="market-vault-badge">
            <ShieldCheck size={12} />
            {vaultLabel}
          </span>
          {!available ? <span className={`market-status-badge status-${item.listing.status.toLowerCase()}`}>{statusLabel}</span> : null}
        </div>
        <div className="market-card-copy">
          <span>{item.card.group} · {getMarketplaceCardTypeLabel(item.card.cardType, locale)}</span>
          <strong>{item.card.title}</strong>
        </div>
      </button>

      <div className="market-card-price">
        <div>
          <b>{formatUsd(item.listing.fixedPrice)}</b>
          <small>{recentLabel} {formatUsd(saleRange.recent)}</small>
        </div>
        <button disabled={!available} onClick={() => onBuy(item)} type="button">
          {available ? buyLabel : statusLabel}
        </button>
      </div>
    </article>
  );
}

export function MarketplaceCardTile(props: MarketplaceCardTileProps) {
  return <div className="market-card-cell"><MarketCard {...props} /></div>;
}
