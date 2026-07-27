import { PackageOpen, Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { MarketplaceCardTile } from "./MarketplaceCardTile";
import { MarketplaceDetailDialog } from "./MarketplaceDetailDialog";
import { MarketplaceDialog } from "./MarketplaceDialog";
import { MarketplaceFilterPanel } from "./MarketplaceFilterPanel";
import { MarketplaceSortMenu } from "./MarketplaceSortMenu";
import {
  marketplaceBrowseCategories,
  type MarketplaceBrowseCategory
} from "./marketplaceBrowse";
import type { MarketplaceItem, MarketplaceListing, MarketplaceListingStatus } from "./marketplaceData";
import {
  buildMarketplaceFilterGroups,
  filterMarketplaceCards,
  filterOptionKey,
  sortMarketplaceCards,
  type MarketplaceLocale,
  type MarketplaceSort
} from "./marketplaceFilters";
import type { CardPull } from "./vendingTypes";

export type MarketplaceViewCopy = {
  browseCategories: Record<MarketplaceBrowseCategory, string>;
  browseCategoriesLabel: string;
  browsePhotocards: string;
  cancelListing: string;
  cardType: string;
  clear: string;
  close: string;
  comingSoon: string;
  certificateId: string;
  condition: string;
  delivery: string;
  deliveryEligible: string;
  editPrice: string;
  filterLabels: readonly string[];
  filters: string;
  fmv: string;
  listForSale: string;
  listingPrice: string;
  noResults: string;
  ownedEmpty: string;
  ownedTitle: string;
  rarity: string;
  release: string;
  releaseYear: string;
  search: string;
  sellFromVault: string;
  serial: string;
  sort: string;
  sortOptions: Record<MarketplaceSort, string>;
  statusLabels: Record<MarketplaceListingStatus, string>;
  title: string;
  updateListing: string;
  vaultVerified: string;
};

type MarketplaceViewProps = {
  browseCategory: MarketplaceBrowseCategory;
  copy: MarketplaceViewCopy;
  items: MarketplaceItem[];
  listings: MarketplaceListing[];
  locale: MarketplaceLocale;
  onBrowseCategoryChange: (category: MarketplaceBrowseCategory) => void;
  onOpenSell: (card: CardPull) => void;
  onTargetListingHandled: () => void;
  ownedCards: CardPull[];
  targetListingId: string | undefined;
};

export function MarketplaceView({
  browseCategory,
  copy,
  items,
  locale,
  onBrowseCategoryChange,
  onTargetListingHandled,
  targetListingId
}: MarketplaceViewProps) {
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedKeys, setSelectedKeys] = useState<ReadonlySet<string>>(new Set());
  const [selectedListingId, setSelectedListingId] = useState<string>();
  const [sort, setSort] = useState<MarketplaceSort>("recent");

  const groups = useMemo(
    () => buildMarketplaceFilterGroups(items, copy.filterLabels, locale),
    [copy.filterLabels, items, locale]
  );
  const visibleItems = useMemo(
    () => sortMarketplaceCards(filterMarketplaceCards(items, groups, selectedKeys, query), sort),
    [groups, items, query, selectedKeys, sort]
  );
  const selectedItem = items.find((item) => item.listing.id === selectedListingId);
  const showPhotocards = browseCategory === "all" || browseCategory === "photocards";
  useEffect(() => {
    if (!targetListingId) return;
    if (items.some((item) => item.listing.id === targetListingId)) {
      setSelectedListingId(targetListingId);
    }
    onTargetListingHandled();
  }, [items, onTargetListingHandled, targetListingId]);

  function toggleOption(groupKey: string, optionKey: string) {
    setSelectedKeys((keys) => {
      const next = new Set(keys);
      const key = filterOptionKey(groupKey, optionKey);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function selectBrowseCategory(category: MarketplaceBrowseCategory) {
    setFilterDialogOpen(false);
    setSelectedListingId(undefined);
    onBrowseCategoryChange(category);
  }

  const filterPanel = (
    <MarketplaceFilterPanel
      clearLabel={copy.clear}
      groups={groups}
      items={items}
      onClear={() => setSelectedKeys(new Set())}
      onToggleOption={toggleOption}
      selectedKeys={selectedKeys}
      title={copy.filters}
    />
  );

  return (
    <section className="marketplace-page" id="marketplace">
      <div className="marketplace-title-row">
        <h1>{copy.title}</h1>
      </div>

      <nav className="marketplace-browse-categories" aria-label={copy.browseCategoriesLabel}>
        {marketplaceBrowseCategories.map((category) => (
          <button
            aria-pressed={browseCategory === category}
            className={browseCategory === category ? "selected" : ""}
            key={category}
            onClick={() => selectBrowseCategory(category)}
            type="button"
          >
            {copy.browseCategories[category]}
          </button>
        ))}
      </nav>

      {showPhotocards ? (
        <div className="marketplace-shell">
          <aside className="marketplace-filter-sidebar">{filterPanel}</aside>

          <div className="marketplace-main">
            <div className="marketplace-toolbar">
              <label className="marketplace-search">
                <Search size={17} />
                <input onChange={(event) => setQuery(event.target.value)} placeholder={copy.search} type="search" value={query} />
              </label>
              <button className="marketplace-mobile-filter" onClick={() => setFilterDialogOpen(true)} type="button">
                <SlidersHorizontal size={16} />
                {copy.filters}
                {selectedKeys.size > 0 ? <b>{selectedKeys.size}</b> : null}
              </button>
              <MarketplaceSortMenu
                label={copy.sort}
                onChange={setSort}
                options={copy.sortOptions}
                value={sort}
              />
            </div>

            {visibleItems.length > 0 ? (
              <div className="marketplace-grid">
                {visibleItems.map((item) => (
                  <MarketplaceCardTile
                    fmvLabel={copy.fmv}
                    item={item}
                    key={item.listing.id}
                    onOpen={(selected) => setSelectedListingId(selected.listing.id)}
                    statusLabel={copy.statusLabels[item.listing.status]}
                    vaultLabel={copy.vaultVerified}
                  />
                ))}
              </div>
            ) : (
              <div className="marketplace-no-results">{copy.noResults}</div>
            )}

          </div>
        </div>
      ) : (
        <section className="marketplace-coming-soon" aria-live="polite">
          <span><PackageOpen size={24} /></span>
          <h2>{copy.browseCategories[browseCategory]}</h2>
          <strong>{copy.comingSoon}</strong>
          <button onClick={() => selectBrowseCategory("photocards")} type="button">
            {copy.browsePhotocards}
          </button>
        </section>
      )}

      <MarketplaceDialog className="market-filter-dialog" labelId="market-filter-title" onRequestClose={() => setFilterDialogOpen(false)} open={filterDialogOpen}>
        <div className="market-filter-dialog-panel">
          <header><h2 id="market-filter-title">{copy.filters}</h2><button aria-label={copy.close} data-autofocus onClick={() => setFilterDialogOpen(false)} title={copy.close} type="button"><X size={20} /></button></header>
          {filterPanel}
        </div>
      </MarketplaceDialog>

      <MarketplaceDetailDialog copy={copy} item={selectedItem} locale={locale} onClose={() => setSelectedListingId(undefined)} />
    </section>
  );
}
