import { ArrowUpDown, Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { MarketplaceSort } from "./marketplaceFilters";

const sortOrder: MarketplaceSort[] = [
  "price-asc",
  "price-desc",
  "fmv",
  "recent",
  "name"
];

type MarketplaceSortMenuProps = {
  label: string;
  onChange: (sort: MarketplaceSort) => void;
  options: Record<MarketplaceSort, string>;
  value: MarketplaceSort;
};

export function MarketplaceSortMenu({
  label,
  onChange,
  options,
  value
}: MarketplaceSortMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function closeMenu(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", closeMenu);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeMenu);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div className="marketplace-sort-menu" ref={menuRef}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={label}
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <ArrowUpDown aria-hidden="true" size={16} />
        <strong>{options[value]}</strong>
        <ChevronDown aria-hidden="true" className={open ? "open" : ""} size={15} />
      </button>
      {open ? (
        <div className="marketplace-sort-options" role="menu">
          {sortOrder.map((option) => (
            <button
              aria-checked={value === option}
              className={value === option ? "selected" : ""}
              key={option}
              onClick={() => {
                onChange(option);
                setOpen(false);
              }}
              role="menuitemradio"
              type="button"
            >
              <span>{options[option]}</span>
              {value === option ? <Check aria-hidden="true" size={15} /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
