import { useEffect, useRef, useState } from "react";
import { getPackInventory } from "./vendingData";
import { VendingInventoryCard, type InventoryRarityLabels } from "./VendingInventoryCard";
import type { InventoryCard, PackDetail, RarityTier } from "./vendingTypes";

type InventoryFilter = "all" | RarityTier;

type VendingPackInventoryCopy = {
  allRarities: string;
  estimatedValue: string;
  individualOdds: string;
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
  const [total, setTotal] = useState(pack.featuredInventory.length);
  const requestIdRef = useRef(0);

  useEffect(() => {
    setFilter("all");
    setInventory(pack.featuredInventory);
    setIsExpanded(false);
    setIsLoading(false);
    setLoadError(false);
    setNextCursor(undefined);
    setTotal(pack.featuredInventory.length);
    requestIdRef.current += 1;
  }, [pack]);

  async function loadCards(nextFilter: InventoryFilter, cursor = 0, append = false) {
    const requestId = ++requestIdRef.current;

    setLoadError(false);
    setIsLoading(true);
    try {
      const page = await getPackInventory(pack.id, {
        cursor,
        limit: 24,
        rarity: nextFilter === "all" ? undefined : nextFilter
      });
      if (requestId !== requestIdRef.current) return;

      setInventory((items) => append ? [...items, ...page.items] : page.items);
      setNextCursor(page.nextCursor);
      setTotal(page.total);
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
    setTotal(pack.featuredInventory.length);
  }

  function filterCards(nextFilter: InventoryFilter) {
    setFilter(nextFilter);
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

      {isExpanded ? (
        <div className="vending-inventory-toolbar">
          <label>
            <span className="sr-only">{copy.allRarities}</span>
            <select
              onChange={(event) => filterCards(event.target.value as InventoryFilter)}
              value={filter}
            >
              <option value="all">{copy.allRarities}</option>
              {(Object.keys(rarityLabels) as RarityTier[]).map((rarity) => (
                <option key={rarity} value={rarity}>{rarityLabels[rarity]}</option>
              ))}
            </select>
          </label>
          <span>{inventory.length} / {total}</span>
        </div>
      ) : null}

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
