import { useEffect, useRef, useState } from "react";
import { getPackInventory } from "./vendingData";
import { VendingInventoryCard, type InventoryRarityLabels } from "./VendingInventoryCard";
import type { InventoryCard, PackDetail, RarityTier } from "./vendingTypes";

type InventoryFilter = "all" | RarityTier;

type VendingPackInventoryCopy = {
  allRarities: string;
  insidePack: string;
  loadError?: string;
  loadMore: string;
  redeemable: string;
  showFeatured: string;
  viewAllCards: string;
  viewBack: string;
  viewFront: string;
};

type VendingPackInventoryProps = {
  copy: VendingPackInventoryCopy;
  pack: PackDetail;
  rarityLabels: InventoryRarityLabels;
};

type VendingRarityFiltersProps = {
  allLabel: string;
  filter: InventoryFilter;
  onSelect: (filter: InventoryFilter) => void;
  rarityLabels: InventoryRarityLabels;
};

export function VendingRarityFilters({
  allLabel,
  filter,
  onSelect,
  rarityLabels
}: VendingRarityFiltersProps) {
  const filters: readonly InventoryFilter[] = [
    "all",
    ...(Object.keys(rarityLabels) as RarityTier[])
  ];

  return (
    <div aria-label={allLabel} className="vending-rarity-filters" role="group">
      {filters.map((rarity) => (
        <button
          aria-pressed={filter === rarity}
          className="vending-rarity-filter"
          data-rarity={rarity}
          key={rarity}
          onClick={() => onSelect(rarity)}
          type="button"
        >
          {rarity === "all" ? allLabel : rarityLabels[rarity]}
        </button>
      ))}
    </div>
  );
}

export function VendingPackInventory({
  copy,
  pack,
  rarityLabels
}: VendingPackInventoryProps) {
  const [filter, setFilter] = useState<InventoryFilter>("all");
  const [inventory, setInventory] = useState<readonly InventoryCard[]>(pack.featuredInventory);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [nextCursor, setNextCursor] = useState<number>();
  const requestIdRef = useRef(0);

  useEffect(() => {
    setFilter("all");
    setInventory(pack.featuredInventory);
    setIsExpanded(false);
    setIsLoading(false);
    setLoadError(false);
    setNextCursor(undefined);
    requestIdRef.current += 1;
  }, [pack]);

  async function loadCards(nextFilter: InventoryFilter, cursor = 0, append = false) {
    const requestId = ++requestIdRef.current;

    setLoadError(false);
    setIsLoading(true);
    try {
      const page = await getPackInventory(pack.id, {
        catalog: true,
        cursor,
        limit: 24,
        rarity: nextFilter === "all" ? undefined : nextFilter
      });
      if (requestId !== requestIdRef.current) return;

      setInventory((items) => append ? [...items, ...page.items] : page.items);
      setNextCursor(page.nextCursor);
    } catch {
      if (requestId === requestIdRef.current) setLoadError(true);
    } finally {
      if (requestId === requestIdRef.current) setIsLoading(false);
    }
  }

  async function showAllCards() {
    if (!isExpanded) {
      setIsExpanded(true);
      await loadCards("all");
      return;
    }

    requestIdRef.current += 1;
    setFilter("all");
    setInventory(pack.featuredInventory);
    setIsExpanded(false);
    setIsLoading(false);
    setLoadError(false);
    setNextCursor(undefined);
  }

  function filterCards(nextFilter: InventoryFilter) {
    setFilter(nextFilter);
    setIsExpanded(true);
    void loadCards(nextFilter);
  }

  function loadMoreCards() {
    if (nextCursor !== undefined) void loadCards(filter, nextCursor, true);
  }

  return (
    <section
      className="vending-inventory-section"
      data-expanded={isExpanded}
      id="inventory"
    >
      <div className="vending-section-heading">
        <h2>{copy.insidePack}</h2>
        <button
          className="vending-text-action"
          disabled={isLoading}
          onClick={showAllCards}
          type="button"
        >
          {isExpanded ? copy.showFeatured : copy.viewAllCards}
        </button>
      </div>

      <div className="vending-inventory-toolbar">
        <VendingRarityFilters
          allLabel={copy.allRarities}
          filter={filter}
          onSelect={filterCards}
          rarityLabels={rarityLabels}
        />
      </div>

      <div className="vending-inventory-grid" aria-busy={isLoading}>
        {inventory.map((card) => (
          <VendingInventoryCard
            card={card}
            copy={copy}
            key={card.id}
            rarityLabel={rarityLabels[card.tier]}
          />
        ))}
      </div>

      {loadError && copy.loadError ? <p className="vending-load-error" role="status">{copy.loadError}</p> : null}
      {isExpanded && nextCursor !== undefined ? (
        <button
          className="vending-load-more"
          disabled={isLoading}
          onClick={loadMoreCards}
          type="button"
        >
          {copy.loadMore}
        </button>
      ) : null}
    </section>
  );
}
