import type { Locale } from "./appTypes";
import type {
  MarketplaceCardType,
  MarketplaceCondition,
  MarketplaceItem
} from "./marketplaceData";
import type { Rarity } from "./vendingTypes";

export type MarketplaceLocale = Locale;
export type MarketplaceSort = "price-asc" | "price-desc" | "fmv" | "recent" | "name";

export type MarketplaceFilterOption = {
  key: string;
  label: string;
  matches: (item: MarketplaceItem) => boolean;
};

export type MarketplaceFilterGroup = {
  key: string;
  label: string;
  options: MarketplaceFilterOption[];
};

const localizedValues = {
  en: {
    type: { Album: "Album", POB: "POB", "Lucky Draw": "Lucky Draw", Event: "Event", Limited: "Limited" },
    condition: { Mint: "Mint", "Near Mint": "Near Mint", Excellent: "Excellent", Ungraded: "Ungraded" },
    rarity: { Common: "Common", Rare: "Rare", Epic: "Epic", Legendary: "Legendary", Iruka: "Iruka" }
  },
  ko: {
    type: { Album: "앨범", POB: "예약 특전", "Lucky Draw": "럭키드로우", Event: "이벤트", Limited: "한정" },
    condition: { Mint: "민트", "Near Mint": "최상", Excellent: "양호", Ungraded: "미등급" },
    rarity: { Common: "일반", Rare: "레어", Epic: "에픽", Legendary: "레전더리", Iruka: "이루카" }
  }
} satisfies Record<Locale, {
  condition: Record<MarketplaceCondition, string>;
  rarity: Record<Rarity, string>;
  type: Record<MarketplaceCardType, string>;
}>;

export function getMarketplaceCardTypeLabel(
  value: MarketplaceCardType,
  locale: MarketplaceLocale
) {
  return localizedValues[locale].type[value];
}

export function getMarketplaceConditionLabel(
  value: MarketplaceCondition,
  locale: MarketplaceLocale
) {
  return localizedValues[locale].condition[value];
}

export function getMarketplaceRarityLabel(value: Rarity, locale: MarketplaceLocale) {
  return localizedValues[locale].rarity[value];
}

export function filterOptionKey(groupKey: string, optionKey: string) {
  return `${groupKey}:${optionKey}`;
}

function uniqueOptions(
  items: MarketplaceItem[],
  getValue: (item: MarketplaceItem) => string,
  getLabel: (value: string) => string = (value) => value
): MarketplaceFilterOption[] {
  return [...new Set(items.map(getValue))].sort().map((value) => ({
    key: value,
    label: getLabel(value),
    matches: (item) => getValue(item) === value
  }));
}

export function buildMarketplaceFilterGroups(
  items: MarketplaceItem[],
  labels: readonly string[],
  locale: MarketplaceLocale
): MarketplaceFilterGroup[] {
  const values = localizedValues[locale];

  return [
    { key: "group", label: labels[0], options: uniqueOptions(items, (item) => item.card.group) },
    {
      key: "rarity",
      label: labels[1],
      options: uniqueOptions(
        items,
        (item) => item.card.rarity,
        (value) => values.rarity[value as Rarity]
      )
    },
    { key: "member", label: labels[2], options: uniqueOptions(items, (item) => item.card.member) },
    {
      key: "type",
      label: labels[3],
      options: uniqueOptions(
        items,
        (item) => item.card.cardType,
        (value) => values.type[value as MarketplaceCardType]
      )
    },
    {
      key: "condition",
      label: labels[4],
      options: uniqueOptions(
        items,
        (item) => item.inventory.condition,
        (value) => values.condition[value as MarketplaceCondition]
      )
    }
  ];
}

export function filterMarketplaceCards(
  items: MarketplaceItem[],
  groups: MarketplaceFilterGroup[],
  selectedKeys: ReadonlySet<string>,
  query: string
) {
  const text = query.trim().toLocaleLowerCase();

  return items.filter((item) => {
    const searchable = [
      item.card.title,
      item.card.group,
      item.card.member,
      item.card.release,
      item.card.cardType,
      item.inventory.serial
    ];
    if (text && !searchable.some((field) => field.toLocaleLowerCase().includes(text))) {
      return false;
    }

    return groups.every((group) => {
      const active = group.options.filter((option) =>
        selectedKeys.has(filterOptionKey(group.key, option.key))
      );
      return active.length === 0 || active.some((option) => option.matches(item));
    });
  });
}

export function sortMarketplaceCards(
  items: MarketplaceItem[],
  sort: MarketplaceSort
) {
  return [...items].sort((a, b) => {
    const nameDifference = `${a.card.group} ${a.card.title}`.localeCompare(
      `${b.card.group} ${b.card.title}`
    );
    if (sort === "price-asc") return a.listing.fixedPrice - b.listing.fixedPrice || nameDifference;
    if (sort === "price-desc") return b.listing.fixedPrice - a.listing.fixedPrice || nameDifference;
    if (sort === "fmv") return b.card.fmv - a.card.fmv || nameDifference;
    if (sort === "recent") return b.listing.listedAt.localeCompare(a.listing.listedAt) || nameDifference;
    return nameDifference;
  });
}
