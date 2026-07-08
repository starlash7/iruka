import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import type { MarketplaceCard } from "./marketplaceData";
import { filterOptionKey, type MarketplaceFilterGroup } from "./marketplaceFilters";

type MarketplaceFilterPanelProps = {
  groups: MarketplaceFilterGroup[];
  items: MarketplaceCard[];
  onToggleOption: (groupIndex: number, value: string) => void;
  selectedKeys: ReadonlySet<string>;
  title: string;
};

export function MarketplaceFilterPanel({
  groups,
  items,
  onToggleOption,
  selectedKeys,
  title
}: MarketplaceFilterPanelProps) {
  const [openGroup, setOpenGroup] = useState(1);

  return (
    <aside className="marketplace-filters" aria-label={title}>
      <div className="marketplace-filter-title">
        <SlidersHorizontal size={17} />
        <strong>{title}</strong>
      </div>
      {groups.map((group, groupIndex) => {
        const isOpen = openGroup === groupIndex;
        const activeCount = group.options.filter((option) =>
          selectedKeys.has(filterOptionKey(groupIndex, option.value))
        ).length;

        return (
          <div className="marketplace-filter-group" key={group.label}>
            <button
              aria-expanded={isOpen}
              onClick={() => setOpenGroup(isOpen ? -1 : groupIndex)}
              type="button"
            >
              {group.label}
              {activeCount > 0 ? <b>{activeCount}</b> : null}
              <span>{isOpen ? "−" : "+"}</span>
            </button>
            {isOpen ? (
              <div className="marketplace-filter-options">
                {group.options.map((option) => {
                  const key = filterOptionKey(groupIndex, option.value);
                  const selected = selectedKeys.has(key);

                  return (
                    <button
                      aria-pressed={selected}
                      className={selected ? "selected" : ""}
                      key={key}
                      onClick={() => onToggleOption(groupIndex, option.value)}
                      type="button"
                    >
                      {option.value}
                      <small>{items.filter(option.matches).length}</small>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        );
      })}
    </aside>
  );
}
