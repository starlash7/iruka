import type { MarketplaceCard } from "./marketplaceData";

export type MarketplaceLocale = "en" | "ko";
export type MarketplaceSort = "recent" | "price-desc" | "price-asc";

export type MarketplaceFilterOption = {
  matches: (item: MarketplaceCard) => boolean;
  value: string;
};

export type MarketplaceFilterGroup = {
  label: string;
  options: MarketplaceFilterOption[];
};

const PRICE_BAND_LOW = 100000;
const PRICE_BAND_HIGH = 200000;

export function formatMarketWon(value: number, locale: MarketplaceLocale) {
  return new Intl.NumberFormat(locale === "ko" ? "ko-KR" : "en-US", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0
  }).format(value);
}

export function filterOptionKey(groupIndex: number, value: string) {
  return `${groupIndex}:${value}`;
}

function uniqueFieldOptions(
  items: MarketplaceCard[],
  field: "category" | "rarity" | "grade"
): MarketplaceFilterOption[] {
  return [...new Set(items.map((item) => item[field]))].map((value) => ({
    value,
    matches: (item) => item[field] === value
  }));
}

export function buildMarketplaceFilterGroups(
  items: MarketplaceCard[],
  labels: readonly string[],
  locale: MarketplaceLocale
): MarketplaceFilterGroup[] {
  const low = formatMarketWon(PRICE_BAND_LOW, locale);
  const high = formatMarketWon(PRICE_BAND_HIGH, locale);

  return [
    { label: labels[0], options: [{ value: "Listed", matches: () => true }] },
    { label: labels[1], options: uniqueFieldOptions(items, "category") },
    { label: labels[2], options: uniqueFieldOptions(items, "rarity") },
    { label: labels[3], options: uniqueFieldOptions(items, "grade") },
    {
      label: labels[4],
      options: [
        { value: `~ ${low}`, matches: (item) => item.price < PRICE_BAND_LOW },
        {
          value: `${low} ~ ${high}`,
          matches: (item) =>
            item.price >= PRICE_BAND_LOW && item.price < PRICE_BAND_HIGH
        },
        { value: `${high} +`, matches: (item) => item.price >= PRICE_BAND_HIGH }
      ]
    }
  ];
}

export function filterMarketplaceCards(
  items: MarketplaceCard[],
  groups: MarketplaceFilterGroup[],
  selectedKeys: ReadonlySet<string>,
  query: string
) {
  const text = query.trim().toLowerCase();

  return items.filter((item) => {
    const searchable = [
      item.title,
      item.group,
      item.member,
      item.serial,
      item.category,
      item.rarity
    ];
    if (text && !searchable.some((field) => field.toLowerCase().includes(text))) {
      return false;
    }

    return groups.every((group, groupIndex) => {
      const active = group.options.filter((option) =>
        selectedKeys.has(filterOptionKey(groupIndex, option.value))
      );
      return active.length === 0 || active.some((option) => option.matches(item));
    });
  });
}

export function sortMarketplaceCards(
  items: MarketplaceCard[],
  sort: MarketplaceSort
) {
  if (sort === "recent") return items;
  const direction = sort === "price-asc" ? 1 : -1;
  return [...items].sort((a, b) => direction * (a.price - b.price));
}

export function cycleMarketplaceSort(sort: MarketplaceSort): MarketplaceSort {
  if (sort === "recent") return "price-desc";
  if (sort === "price-desc") return "price-asc";
  return "recent";
}
