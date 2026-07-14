import { ChevronDown, RotateCcw, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import type { MarketplaceItem } from "./marketplaceData";
import { filterOptionKey, type MarketplaceFilterGroup } from "./marketplaceFilters";

type MarketplaceFilterPanelProps = {
  clearLabel: string;
  groups: MarketplaceFilterGroup[];
  items: MarketplaceItem[];
  onClear: () => void;
  onToggleOption: (groupKey: string, optionKey: string) => void;
  selectedKeys: ReadonlySet<string>;
  title: string;
};

export function MarketplaceFilterPanel({
  clearLabel,
  groups,
  items,
  onClear,
  onToggleOption,
  selectedKeys,
  title
}: MarketplaceFilterPanelProps) {
  const [openGroups, setOpenGroups] = useState<ReadonlySet<string>>(
    () => new Set(groups.slice(0, 2).map((group) => group.key))
  );

  return (
    <div className="marketplace-filters" aria-label={title}>
      <div className="marketplace-filter-title">
        <SlidersHorizontal size={17} />
        <strong>{title}</strong>
        {selectedKeys.size > 0 ? (
          <button onClick={onClear} type="button">
            <RotateCcw size={13} />
            {clearLabel}
          </button>
        ) : null}
      </div>

      {groups.map((group) => {
        const activeCount = group.options.filter((option) =>
          selectedKeys.has(filterOptionKey(group.key, option.key))
        ).length;

        return (
          <details
            className="marketplace-filter-group"
            key={group.key}
            onToggle={(event) => {
              const open = event.currentTarget.open;
              setOpenGroups((current) => {
                const next = new Set(current);
                open ? next.add(group.key) : next.delete(group.key);
                return next;
              });
            }}
            open={openGroups.has(group.key)}
          >
            <summary>
              <span>{group.label}</span>
              {activeCount > 0 ? <b>{activeCount}</b> : null}
              <ChevronDown size={15} />
            </summary>
            <div className="marketplace-filter-options">
              {group.options.map((option) => {
                const key = filterOptionKey(group.key, option.key);
                const selected = selectedKeys.has(key);
                return (
                  <button
                    aria-pressed={selected}
                    className={selected ? "selected" : ""}
                    key={key}
                    onClick={() => onToggleOption(group.key, option.key)}
                    type="button"
                  >
                    <span>{option.label}</span>
                    <small>{items.filter(option.matches).length}</small>
                  </button>
                );
              })}
            </div>
          </details>
        );
      })}
    </div>
  );
}
