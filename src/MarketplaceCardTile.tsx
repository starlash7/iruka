import { IrukaBeam } from "./IrukaBeam";
import type { MarketplaceCard } from "./marketplaceData";
import { formatMarketWon, type MarketplaceLocale } from "./marketplaceFilters";

type MarketplaceCardTileProps = {
  buyLabel: string;
  featured: boolean;
  fmvLabel: string;
  item: MarketplaceCard;
  locale: MarketplaceLocale;
  onBuy: (item: MarketplaceCard) => void;
};

function getCardInitials(item: MarketplaceCard) {
  return item.member
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function renderMarketCard({
  buyLabel,
  fmvLabel,
  item,
  locale,
  onBuy
}: Omit<MarketplaceCardTileProps, "featured">) {
  return (
    <article className="market-card">
      <div className={`market-card-art tone-${item.tone}`}>
        <span className="market-card-points">{item.points}</span>
        <div className={`market-card-slab rarity-${item.rarity.toLowerCase()}`}>
          <span>{item.grade}</span>
          <div className="market-card-photo" aria-hidden="true">
            <i />
            <b>{getCardInitials(item)}</b>
          </div>
          <small>{item.serial}</small>
        </div>
      </div>
      <div className="market-card-copy">
        <span>{item.category} · {item.rarity}</span>
        <strong>{item.title}</strong>
        <div>
          <b>{formatMarketWon(item.price, locale)}</b>
          <small>{fmvLabel} {formatMarketWon(item.fmv, locale)}</small>
        </div>
        <button onClick={() => onBuy(item)} type="button">
          {buyLabel}
        </button>
      </div>
    </article>
  );
}

export function MarketplaceCardTile(props: MarketplaceCardTileProps) {
  const card = renderMarketCard(props);

  if (props.featured) {
    return (
      <IrukaBeam className="market-card-beam" variant="selection">
        {card}
      </IrukaBeam>
    );
  }

  return <div className="market-card-cell">{card}</div>;
}
