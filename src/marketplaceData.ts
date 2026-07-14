import type { Category, Rarity } from "./vendingTypes";

export type MarketplaceCardType = "Album" | "POB" | "Lucky Draw" | "Event" | "Limited";
export type MarketplaceCondition = "Mint" | "Near Mint" | "Excellent";
export type MarketplaceListingStatus = "Available" | "Reserved" | "Sold" | "Cancelled";

export type CatalogCard = {
  cardType: MarketplaceCardType;
  category: Category;
  group: string;
  id: string;
  imageUrl: string;
  member: string;
  rarity: Rarity;
  release: string;
  title: string;
  version: string;
};

export type VaultInventoryItem = {
  catalogCardId: string;
  condition: MarketplaceCondition;
  custodyVerified: boolean;
  id: string;
  redemptionEligible: boolean;
  serial: string;
  verificationId: string;
};

export type MarketplaceListing = {
  fixedPrice: number;
  id: string;
  inventoryId: string;
  listedAt: string;
  status: MarketplaceListingStatus;
};

export type MarketplaceSale = {
  catalogCardId: string;
  currency: "USD";
  id: string;
  price: number;
  soldAt: string;
};

export type MarketplaceItem = {
  card: CatalogCard;
  inventory: VaultInventoryItem;
  listing: MarketplaceListing;
  sales: MarketplaceSale[];
};

type MemberSeed = {
  cardTypes: readonly [MarketplaceCardType, MarketplaceCardType];
  conditions: readonly [MarketplaceCondition, MarketplaceCondition];
  group: string;
  imageBase: string;
  member: string;
  prices: readonly [number, number];
  rarities: readonly [Rarity, Rarity];
  release: string;
};

const cardImages = import.meta.glob<string>("./assets/marketplace/*.webp", {
  eager: true,
  import: "default"
});

const memberSeeds: MemberSeed[] = [
  { group: "LUMINA", member: "Ari", release: "First Light", imageBase: "lumina-ari", cardTypes: ["Limited", "Event"], rarities: ["Iruka", "Legendary"], conditions: ["Mint", "Near Mint"], prices: [229, 117] },
  { group: "LUMINA", member: "Nari", release: "First Light", imageBase: "lumina-nari", cardTypes: ["POB", "Album"], rarities: ["Epic", "Rare"], conditions: ["Mint", "Excellent"], prices: [63, 33] },
  { group: "LUMINA", member: "Sol", release: "First Light", imageBase: "lumina-sol", cardTypes: ["Album", "Lucky Draw"], rarities: ["Common", "Rare"], conditions: ["Near Mint", "Mint"], prices: [9, 20] },
  { group: "MUSE:ON", member: "Jia", release: "Open Channel", imageBase: "museon-jia", cardTypes: ["POB", "Limited"], rarities: ["Epic", "Legendary"], conditions: ["Near Mint", "Mint"], prices: [53, 99] },
  { group: "MUSE:ON", member: "Rue", release: "Open Channel", imageBase: "museon-rue", cardTypes: ["Album", "Event"], rarities: ["Common", "Rare"], conditions: ["Excellent", "Near Mint"], prices: [13, 37] },
  { group: "MUSE:ON", member: "Yuna", release: "Open Channel", imageBase: "museon-yuna", cardTypes: ["Lucky Draw", "Limited"], rarities: ["Epic", "Legendary"], conditions: ["Mint", "Mint"], prices: [69, 150] },
  { group: "NORTHSTAR", member: "Ren", release: "Polaris", imageBase: "northstar-ren", cardTypes: ["Limited", "POB"], rarities: ["Legendary", "Epic"], conditions: ["Mint", "Near Mint"], prices: [99, 49] },
  { group: "NORTHSTAR", member: "Ido", release: "Polaris", imageBase: "northstar-ido", cardTypes: ["Album", "Event"], rarities: ["Rare", "Epic"], conditions: ["Excellent", "Mint"], prices: [23, 84] },
  { group: "NORTHSTAR", member: "Min", release: "Polaris", imageBase: "northstar-min", cardTypes: ["Album", "Lucky Draw"], rarities: ["Common", "Rare"], conditions: ["Near Mint", "Mint"], prices: [6, 17] },
  { group: "ZEROSEVEN", member: "Leo", release: "Frame 07", imageBase: "zeroseven-leo", cardTypes: ["POB", "Limited"], rarities: ["Epic", "Legendary"], conditions: ["Near Mint", "Mint"], prices: [60, 126] },
  { group: "ZEROSEVEN", member: "Jun", release: "Frame 07", imageBase: "zeroseven-jun", cardTypes: ["Album", "Event"], rarities: ["Common", "Rare"], conditions: ["Excellent", "Near Mint"], prices: [11, 30] },
  { group: "ZEROSEVEN", member: "Tae", release: "Frame 07", imageBase: "zeroseven-tae", cardTypes: ["Limited", "Lucky Draw"], rarities: ["Iruka", "Epic"], conditions: ["Mint", "Mint"], prices: [160, 80] }
];

const versions = ["Signal", "Encore"] as const;
const reservedIndexes = new Set([5, 17]);
const soldIndexes = new Set([9, 22]);

function getCardImage(imageBase: string, version: string) {
  const path = `./assets/marketplace/${imageBase}-${version.toLowerCase()}.webp`;
  const imageUrl = cardImages[path];
  if (!imageUrl) throw new Error(`Missing marketplace image: ${path}`);
  return imageUrl;
}

export const catalogCards: CatalogCard[] = memberSeeds.flatMap((member, memberIndex) =>
  versions.map((version, versionIndex) => {
    const id = `${member.imageBase}-${version.toLowerCase()}`;
    return {
      id,
      title: `${member.member} ${version}`,
      group: member.group,
      member: member.member,
      category: "K-pop" as const,
      release: member.release,
      version: `${version} ver.`,
      cardType: member.cardTypes[versionIndex],
      rarity: member.rarities[versionIndex],
      imageUrl: getCardImage(member.imageBase, version),
      seedIndex: memberIndex * 2 + versionIndex
    };
  })
).map(({ seedIndex: _seedIndex, ...card }) => card);

export const vaultInventory: VaultInventoryItem[] = catalogCards.map((card, index) => ({
  id: `inventory-${String(index + 1).padStart(3, "0")}`,
  catalogCardId: card.id,
  serial: `IRK-MKT-${String(index + 1).padStart(4, "0")}`,
  condition: memberSeeds[Math.floor(index / 2)].conditions[index % 2],
  custodyVerified: true,
  redemptionEligible: true,
  verificationId: `VRF-26-${String(4100 + index).padStart(4, "0")}`
}));

export const initialMarketplaceListings: MarketplaceListing[] = vaultInventory.map(
  (inventory, index) => ({
    id: `listing-${String(index + 1).padStart(3, "0")}`,
    inventoryId: inventory.id,
    fixedPrice: memberSeeds[Math.floor(index / 2)].prices[index % 2],
    status: reservedIndexes.has(index)
      ? "Reserved"
      : soldIndexes.has(index)
        ? "Sold"
        : "Available",
    listedAt: new Date(Date.UTC(2026, 6, 10, 12, 0) - index * 73 * 60 * 1000).toISOString()
  })
);

const saleMultipliers = [0.94, 1.03, 0.98, 1.08, 0.9] as const;

export const marketplaceSales: MarketplaceSale[] = catalogCards.flatMap((card, cardIndex) => {
  const listPrice = initialMarketplaceListings[cardIndex].fixedPrice;
  return saleMultipliers.map((multiplier, saleIndex) => ({
    id: `sale-${String(cardIndex + 1).padStart(3, "0")}-${saleIndex + 1}`,
    catalogCardId: card.id,
    currency: "USD",
    price: Math.round(listPrice * multiplier),
    soldAt: new Date(Date.UTC(2026, 6, 9) - (saleIndex * 6 + cardIndex % 4) * 86400000).toISOString()
  }));
});

export function getMarketplaceItems(listings: MarketplaceListing[]): MarketplaceItem[] {
  return listings.flatMap((listing) => {
    if (listing.status === "Cancelled") return [];
    const inventory = vaultInventory.find((item) => item.id === listing.inventoryId);
    const card = inventory
      ? catalogCards.find((item) => item.id === inventory.catalogCardId)
      : undefined;
    if (!inventory || !card) return [];

    return [{
      card,
      inventory,
      listing,
      sales: marketplaceSales
        .filter((sale) => sale.catalogCardId === card.id)
        .sort((a, b) => b.soldAt.localeCompare(a.soldAt))
    }];
  });
}

export function getMarketplaceSaleRange(sales: MarketplaceSale[]) {
  const prices = sales.map((sale) => sale.price);
  return {
    high: Math.max(...prices),
    low: Math.min(...prices),
    recent: sales[0]?.price ?? 0
  };
}
