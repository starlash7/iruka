import { useEffect, useState } from "react";
import { ShieldCheck, X } from "lucide-react";
import { formatUsd } from "./currency";
import { MarketplaceDialog } from "./MarketplaceDialog";
import type { MarketplaceListing } from "./marketplaceData";
import type { MarketplaceViewCopy } from "./MarketplaceView";
import type { CardPull } from "./vendingTypes";

type MarketplaceSellDialogProps = {
  card: CardPull | undefined;
  copy: MarketplaceViewCopy;
  listing: MarketplaceListing | undefined;
  onCancelListing: (card: CardPull) => void;
  onClose: () => void;
  onSave: (card: CardPull, price: number) => void;
};

export function MarketplaceSellDialog({
  card,
  copy,
  listing,
  onCancelListing,
  onClose,
  onSave
}: MarketplaceSellDialogProps) {
  const [price, setPrice] = useState("");

  useEffect(() => {
    if (!card) return;
    setPrice(String(listing?.fixedPrice ?? Math.max(1, Math.round(card.estimatedValue))));
  }, [card, listing?.fixedPrice]);

  const numericPrice = Number(price);
  const listed = card?.vaultStatus === "Listed" && listing?.status === "Available";

  return (
    <MarketplaceDialog className="market-sell-dialog" labelId="market-sell-title" onRequestClose={onClose} open={Boolean(card)}>
      {card ? (
        <form
          className="market-sell-panel"
          onSubmit={(event) => {
            event.preventDefault();
            if (!Number.isFinite(numericPrice) || numericPrice < 1) return;
            onSave(card, Math.round(numericPrice));
          }}
        >
          <header>
            <div>
              <span>{listed ? copy.editPrice : copy.sellFromVault}</span>
              <h2 id="market-sell-title">{card.member}</h2>
            </div>
            <button aria-label={copy.close} data-autofocus onClick={onClose} title={copy.close} type="button">
              <X size={20} />
            </button>
          </header>

          <div className="market-sell-card">
            {card.imageUrl ? <img alt="" src={card.imageUrl} /> : <ShieldCheck size={22} />}
            <div>
              <strong>{card.group}</strong>
              <span>{card.serial}</span>
            </div>
            <small>{formatUsd(card.estimatedValue)}</small>
          </div>

          <label className="market-price-input">
            <span>{copy.listingPrice}</span>
            <div><b>$</b><input inputMode="numeric" min="1" onChange={(event) => setPrice(event.target.value)} step="1" type="number" value={price} /></div>
          </label>

          <button className="market-save-listing" disabled={!Number.isFinite(numericPrice) || numericPrice < 1} type="submit">
            {listed ? copy.updateListing : copy.listForSale}
          </button>
          {listed ? (
            <button className="market-cancel-listing" onClick={() => onCancelListing(card)} type="button">
              {copy.cancelListing}
            </button>
          ) : null}
        </form>
      ) : null}
    </MarketplaceDialog>
  );
}
