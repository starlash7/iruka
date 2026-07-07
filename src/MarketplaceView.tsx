import { ArrowUpDown, Search, ShieldCheck, SlidersHorizontal, Store } from "lucide-react";
import irukaLogo from "./assets/iruka-logo.png";
import type { MarketplaceCard } from "./marketplaceData";

type Locale = "en" | "ko";
type CardStatus = "Vaulted" | "Listed" | "Sold" | "Redeem queued";
type CardCategory = "K-pop" | "TCG";
type CardRarity = "Common" | "Rare" | "Epic" | "Legendary" | "Iruka";

type OwnedCard = {
  category: CardCategory;
  estimatedValue: number;
  group: string;
  id: string;
  member: string;
  rarity: CardRarity;
  serial: string;
  vaultStatus: CardStatus;
};

type MarketplaceCopy = {
  buyNow: string;
  filterLabels: readonly string[];
  filters: string;
  fmv: string;
  ownedEmpty: string;
  ownedTitle: string;
  results: string;
  search: string;
  sell: string;
  sort: string;
  title: string;
};

type MarketplaceViewProps = {
  copy: MarketplaceCopy;
  items: MarketplaceCard[];
  locale: Locale;
  onBuy: (item: MarketplaceCard) => void;
  onSell: (card: OwnedCard) => void;
  ownedCards: OwnedCard[];
};

export function MarketplaceView({
  copy,
  items,
  locale,
  onBuy,
  onSell,
  ownedCards
}: MarketplaceViewProps) {
  return (
    <section className="marketplace-page" id="marketplace">
      <div className="marketplace-title-row">
        <h1>{copy.title}</h1>
        <span>{items.length} {copy.results}</span>
      </div>

      <div className="marketplace-shell">
        <aside className="marketplace-filters" aria-label={copy.filters}>
          <div className="marketplace-filter-title">
            <SlidersHorizontal size={17} />
            <strong>{copy.filters}</strong>
          </div>
          {copy.filterLabels.map((item) => (
            <button key={item} type="button">
              {item}
              <span>+</span>
            </button>
          ))}
        </aside>

        <div className="marketplace-main">
          <div className="marketplace-toolbar">
            <label className="marketplace-search">
              <Search size={17} />
              <input placeholder={copy.search} type="search" />
            </label>
            <button type="button">
              <ArrowUpDown size={16} />
              {copy.sort}
            </button>
            <button type="button">
              <Store size={16} />
              {copy.sell}
            </button>
          </div>

          <div className="marketplace-grid">
            {items.map((item) => (
              <article className="market-card" key={item.id}>
                <div className={`market-card-art tone-${item.tone}`}>
                  <span className="market-card-points">{item.points}</span>
                  <div className="market-card-slab">
                    <span>{item.grade}</span>
                    <img alt="" src={irukaLogo} />
                    <small>{item.serial}</small>
                  </div>
                </div>
                <div className="market-card-copy">
                  <span>{item.category} · {item.rarity}</span>
                  <strong>{item.title}</strong>
                  <div>
                    <b>{formatWon(item.price, locale)}</b>
                    <small>{copy.fmv} {formatWon(item.fmv, locale)}</small>
                  </div>
                  <button onClick={() => onBuy(item)} type="button">
                    {copy.buyNow}
                  </button>
                </div>
              </article>
            ))}
          </div>

          <section className="marketplace-owned" aria-label={copy.ownedTitle}>
            <div className="section-heading compact">
              <h2>{copy.ownedTitle}</h2>
            </div>
            {ownedCards.length > 0 ? (
              <div className="owned-list">
                {ownedCards.map((card) => (
                  <button key={card.id} onClick={() => onSell(card)} type="button">
                    <ShieldCheck size={16} />
                    <span>{card.serial}</span>
                    <strong>{card.member}</strong>
                    <small>{formatWon(card.estimatedValue, locale)}</small>
                  </button>
                ))}
              </div>
            ) : (
              <div className="owned-empty">{copy.ownedEmpty}</div>
            )}
          </section>
        </div>
      </div>
    </section>
  );
}

function formatWon(value: number, locale: Locale) {
  return new Intl.NumberFormat(locale === "ko" ? "ko-KR" : "en-US", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0
  }).format(value);
}
