import type { Locale } from "./appTypes";
import type {
  MarketplaceCardType,
  MarketplaceCondition,
  MarketplaceItem,
  MarketplaceListingStatus
} from "./marketplaceData";

export type MarketplaceLocale = Locale;
export type MarketplaceSort = "recent" | "price-asc" | "price-desc";

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
    status: { Available: "Available", Reserved: "Reserved", Sold: "Sold" },
    type: { Album: "Album", POB: "POB", "Lucky Draw": "Lucky Draw", Event: "Event", Limited: "Limited" },
    condition: { Mint: "Mint", "Near Mint": "Near Mint", Excellent: "Excellent" }
  },
  ko: {
    status: { Available: "판매 중", Reserved: "예약 중", Sold: "판매 완료" },
    type: { Album: "앨범", POB: "예약 특전", "Lucky Draw": "럭키드로우", Event: "이벤트", Limited: "한정" },
    condition: { Mint: "민트", "Near Mint": "최상", Excellent: "양호" }
  }
} satisfies Record<Locale, {
  condition: Record<MarketplaceCondition, string>;
  status: Record<Exclude<MarketplaceListingStatus, "Cancelled">, string>;
  type: Record<MarketplaceCardType, string>;
}>;

export function formatMarketplaceDate(value: string, locale: MarketplaceLocale) {
  return new Intl.DateTimeFormat(locale === "ko" ? "ko-KR" : "en-US", {
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}

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
    {
      key: "status",
      label: labels[0],
      options: uniqueOptions(
        items,
        (item) => item.listing.status,
        (value) => values.status[value as keyof typeof values.status]
      )
    },
    { key: "group", label: labels[1], options: uniqueOptions(items, (item) => item.card.group) },
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
    { key: "rarity", label: labels[4], options: uniqueOptions(items, (item) => item.card.rarity) },
    {
      key: "condition",
      label: labels[5],
      options: uniqueOptions(
        items,
        (item) => item.inventory.condition,
        (value) => values.condition[value as MarketplaceCondition]
      )
    },
    {
      key: "price",
      label: labels[6],
      options: [
        { key: "under-25", label: locale === "ko" ? "$25 미만" : "Under $25", matches: (item) => item.listing.fixedPrice < 25 },
        { key: "25-74", label: "$25-$74", matches: (item) => item.listing.fixedPrice >= 25 && item.listing.fixedPrice < 75 },
        { key: "75-plus", label: locale === "ko" ? "$75 이상" : "$75+", matches: (item) => item.listing.fixedPrice >= 75 }
      ]
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

export function sortMarketplaceCards(items: MarketplaceItem[], sort: MarketplaceSort) {
  return [...items].sort((a, b) => {
    if (sort === "recent") return b.listing.listedAt.localeCompare(a.listing.listedAt);
    const direction = sort === "price-asc" ? 1 : -1;
    return direction * (a.listing.fixedPrice - b.listing.fixedPrice);
  });
}
