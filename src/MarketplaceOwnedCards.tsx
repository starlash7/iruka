import { ShieldCheck } from "lucide-react";
import { formatCardPullValue } from "./cardFlow";
import { formatUsd } from "./currency";
import type { MarketplaceListing } from "./marketplaceData";
import type { CardPull } from "./vendingTypes";

type MarketplaceOwnedCardsProps = {
  cards: CardPull[];
  editPriceLabel: string;
  emptyLabel: string;
  listForSaleLabel: string;
  listings: MarketplaceListing[];
  onOpenSell: (card: CardPull) => void;
  title: string;
};

export function MarketplaceOwnedCards({
  cards,
  editPriceLabel,
  emptyLabel,
  listForSaleLabel,
  listings,
  onOpenSell,
  title
}: MarketplaceOwnedCardsProps) {
  return (
    <section className="marketplace-owned" aria-label={title} id="owned-cards">
      <div className="section-heading compact"><h2>{title}</h2></div>
      {cards.length > 0 ? (
        <div className="owned-list">
          {cards.map((card) => {
            const inventoryId = card.marketplaceInventoryId ?? card.id;
            const listing = listings.find((item) => item.inventoryId === inventoryId);
            const listed = card.vaultStatus === "Listed" && listing?.status === "Available";
            return (
              <button key={card.id} onClick={() => onOpenSell(card)} type="button">
                {card.imageUrl ? (
                  <img alt="" src={card.imageUrl} />
                ) : (
                  <span className="owned-card-icon"><ShieldCheck size={16} /></span>
                )}
                <span><strong>{card.member}</strong><small>{card.group} · {card.serial}</small></span>
                <b>{listed && listing
                  ? formatUsd(listing.fixedPrice)
                  : formatCardPullValue(card)}</b>
                <em>{listed ? editPriceLabel : listForSaleLabel}</em>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="owned-empty">{emptyLabel}</div>
      )}
    </section>
  );
}
