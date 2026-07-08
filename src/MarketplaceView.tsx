import { ArrowUpDown, Search, ShieldCheck, Store } from "lucide-react";
import { useMemo, useState } from "react";
import { MarketplaceCardTile } from "./MarketplaceCardTile";
import { MarketplaceFilterPanel } from "./MarketplaceFilterPanel";
import type { MarketplaceCard } from "./marketplaceData";
import {
  buildMarketplaceFilterGroups,
  cycleMarketplaceSort,
  filterMarketplaceCards,
  filterOptionKey,
  formatMarketWon,
  sortMarketplaceCards,
  type MarketplaceLocale,
  type MarketplaceSort
} from "./marketplaceFilters";

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
  locale: MarketplaceLocale;
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
  const [query, setQuery] = useState("");
  const [selectedKeys, setSelectedKeys] = useState<ReadonlySet<string>>(new Set());
  const [sort, setSort] = useState<MarketplaceSort>("recent");

  const groups = useMemo(
    () => buildMarketplaceFilterGroups(items, copy.filterLabels, locale),
    [items, copy.filterLabels, locale]
  );
  const visibleItems = useMemo(
    () =>
      sortMarketplaceCards(
        filterMarketplaceCards(items, groups, selectedKeys, query),
        sort
      ),
    [items, groups, selectedKeys, query, sort]
  );
  const featuredId = visibleItems.find((item) => item.rarity === "Iruka")?.id;

  function toggleOption(groupIndex: number, value: string) {
    setSelectedKeys((keys) => {
      const next = new Set(keys);
      const key = filterOptionKey(groupIndex, value);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  function scrollToOwned() {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    document.getElementById("owned-cards")?.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start"
    });
  }

  return (
    <section className="marketplace-page" id="marketplace">
      <div className="marketplace-title-row">
        <h1>{copy.title}</h1>
        <span>{visibleItems.length} {copy.results}</span>
      </div>

      <div className="marketplace-shell">
        <MarketplaceFilterPanel
          groups={groups}
          items={items}
          onToggleOption={toggleOption}
          selectedKeys={selectedKeys}
          title={copy.filters}
        />

        <div className="marketplace-main">
          <div className="marketplace-toolbar">
            <label className="marketplace-search">
              <Search size={17} />
              <input
                onChange={(event) => setQuery(event.target.value)}
                placeholder={copy.search}
                type="search"
                value={query}
              />
            </label>
            <button
              aria-pressed={sort !== "recent"}
              className={sort === "recent" ? "" : "selected"}
              onClick={() => setSort(cycleMarketplaceSort)}
              type="button"
            >
              <ArrowUpDown size={16} />
              {copy.sort}
              {sort === "recent" ? null : <b>{sort === "price-desc" ? "₩↓" : "₩↑"}</b>}
            </button>
            <button onClick={scrollToOwned} type="button">
              <Store size={16} />
              {copy.sell}
            </button>
          </div>

          <div className="marketplace-grid">
            {visibleItems.map((item) => (
              <MarketplaceCardTile
                buyLabel={copy.buyNow}
                featured={item.id === featuredId}
                fmvLabel={copy.fmv}
                item={item}
                key={item.id}
                locale={locale}
                onBuy={onBuy}
              />
            ))}
          </div>

          <section className="marketplace-owned" aria-label={copy.ownedTitle} id="owned-cards">
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
                    <small>{formatMarketWon(card.estimatedValue, locale)}</small>
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
