import { PackageCheck, ShieldCheck, X } from "lucide-react";
import { formatUsd } from "./currency";
import { MarketplaceDialog } from "./MarketplaceDialog";
import { getMarketplaceSaleRange, type MarketplaceItem } from "./marketplaceData";
import {
  formatMarketplaceDate,
  getMarketplaceCardTypeLabel,
  getMarketplaceConditionLabel,
  type MarketplaceLocale
} from "./marketplaceFilters";
import type { MarketplaceViewCopy } from "./MarketplaceView";

type MarketplaceDetailDialogProps = {
  copy: MarketplaceViewCopy;
  item: MarketplaceItem | undefined;
  locale: MarketplaceLocale;
  onBuy: (item: MarketplaceItem) => void;
  onClose: () => void;
};

export function MarketplaceDetailDialog({ copy, item, locale, onBuy, onClose }: MarketplaceDetailDialogProps) {
  const range = item ? getMarketplaceSaleRange(item.sales) : undefined;
  const available = item?.listing.status === "Available";

  return (
    <MarketplaceDialog className="market-detail-dialog" labelId="market-detail-title" onRequestClose={onClose} open={Boolean(item)}>
      {item && range ? (
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
            <span><ShieldCheck size={14} />{copy.vaultVerified}</span>
          </div>

          <div className="market-detail-meta">
            <div><span>{copy.condition}</span><strong>{getMarketplaceConditionLabel(item.inventory.condition, locale)}</strong></div>
            <div><span>{copy.serial}</span><strong>{item.inventory.serial}</strong></div>
            <div><span>{copy.version}</span><strong>{item.card.version}</strong></div>
            <div><span>{copy.delivery}</span><strong><PackageCheck size={14} />{copy.deliveryEligible}</strong></div>
          </div>

          <section className="market-detail-pricing" aria-label={copy.priceHistory}>
            <div className="market-detail-price-primary">
              <span>{copy.fixedPrice}</span>
              <strong>{formatUsd(item.listing.fixedPrice)}</strong>
            </div>
            <div><span>{copy.recentSale}</span><strong>{formatUsd(range.recent)}</strong></div>
            <div><span>{copy.thirtyDayRange}</span><strong>{formatUsd(range.low)}–{formatUsd(range.high)}</strong></div>
          </section>

          <button className="market-detail-buy" disabled={!available} onClick={() => onBuy(item)} type="button">
            {available ? copy.buyNow : copy.statusLabels[item.listing.status]}
          </button>

          <section className="market-sales-history">
            <h3>{copy.recentSales}</h3>
            <div>
              {item.sales.map((sale) => (
                <p key={sale.id}>
                  <span>{formatMarketplaceDate(sale.soldAt, locale)}</span>
                  <strong>{formatUsd(sale.price)}</strong>
                </p>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </MarketplaceDialog>
  );
}
