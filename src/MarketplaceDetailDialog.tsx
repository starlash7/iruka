import { PackageCheck, ShieldCheck, X } from "lucide-react";
import { MarketplaceDialog } from "./MarketplaceDialog";
import type { MarketplaceItem } from "./marketplaceData";
import {
  getMarketplaceCardTypeLabel,
  getMarketplaceConditionLabel,
  getMarketplaceRarityLabel,
  type MarketplaceLocale
} from "./marketplaceFilters";
import type { MarketplaceViewCopy } from "./MarketplaceView";

type MarketplaceDetailDialogProps = {
  copy: MarketplaceViewCopy;
  item: MarketplaceItem | undefined;
  locale: MarketplaceLocale;
  onClose: () => void;
};

export function MarketplaceDetailDialog({ copy, item, locale, onClose }: MarketplaceDetailDialogProps) {
  return (
    <MarketplaceDialog className="market-detail-dialog" labelId="market-detail-title" onRequestClose={onClose} open={Boolean(item)}>
      {item ? (
        <div className="market-detail-panel">
          <header>
            <div>
              <span>{item.card.group} · {getMarketplaceCardTypeLabel(item.card.cardType, locale)}</span>
              <h2 id="market-detail-title">{item.card.title}</h2>
            </div>
            <button aria-label={copy.close} data-autofocus onClick={onClose} title={copy.close} type="button">
              <X size={20} />
            </button>
          </header>

          <div className="market-detail-image">
            <img alt={`${item.card.group} ${item.card.title}`} src={item.card.imageUrl} />
            {item.inventory.custodyVerified ? (
              <span><ShieldCheck size={14} />{copy.vaultVerified}</span>
            ) : null}
          </div>

          <div className="market-detail-meta">
            <div><span>{copy.release}</span><strong>{item.card.release}</strong></div>
            {item.card.releaseYear ? (
              <div><span>{copy.releaseYear}</span><strong>{item.card.releaseYear}</strong></div>
            ) : null}
            <div><span>{copy.cardType}</span><strong>{getMarketplaceCardTypeLabel(item.card.cardType, locale)}</strong></div>
            <div>
              <span>{copy.rarity}</span>
              <strong className={`rarity-${item.card.rarity.toLowerCase()}`}>
                {getMarketplaceRarityLabel(item.card.rarity, locale)}
              </strong>
            </div>
            <div><span>{copy.condition}</span><strong>{getMarketplaceConditionLabel(item.inventory.condition, locale)}</strong></div>
            <div><span>{copy.serial}</span><strong>{item.inventory.serial}</strong></div>
            {item.inventory.certificateId ? (
              <div><span>{copy.certificateId}</span><strong>{item.inventory.certificateId}</strong></div>
            ) : null}
            {item.inventory.redemptionEligible ? (
              <div><span>{copy.delivery}</span><strong><PackageCheck size={14} />{copy.deliveryEligible}</strong></div>
            ) : null}
          </div>
        </div>
      ) : null}
    </MarketplaceDialog>
  );
}
