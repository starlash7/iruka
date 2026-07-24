import { marketplaceCardSeeds } from "./marketplaceCatalog";
import type { Category, Rarity } from "./vendingTypes";

export type MarketplaceCardType = "Album" | "POB" | "Lucky Draw" | "Event" | "Limited";
export type MarketplaceCondition = "Mint" | "Near Mint" | "Excellent" | "Ungraded";
export type MarketplaceListingStatus = "Available" | "Reserved" | "Sold" | "Cancelled";

export type CatalogCard = {
  cardType: MarketplaceCardType;
  category: Category;
  fmv: number;
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

export type MarketplaceItem = {
  card: CatalogCard;
  inventory: VaultInventoryItem;
  listing: MarketplaceListing;
};

const cardImages = import.meta.glob<string>("./assets/marketplace/*.jpg", {
  eager: true,
  import: "default"
});

function getCardImage(imageFile: string) {
  const path = `./assets/marketplace/${imageFile}`;
  const imageUrl = cardImages[path];
  if (!imageUrl) throw new Error(`Missing marketplace image: ${path}`);
  return imageUrl;
}

export const catalogCards: CatalogCard[] = marketplaceCardSeeds.map((card) => ({
  id: card.id,
  title: `${card.member} ${card.release}`,
  group: card.group,
  member: card.member,
  category: "K-pop",
  fmv: 0,
  release: card.release,
  version: "Photocard",
  cardType: card.cardType,
  rarity: card.rarity,
  imageUrl: getCardImage(card.imageFile)
}));

export const vaultInventory: VaultInventoryItem[] = catalogCards.map((card, index) => ({
  id: `inventory-${String(index + 1).padStart(3, "0")}`,
  catalogCardId: card.id,
  serial: `IRK-MKT-${String(index + 1).padStart(4, "0")}`,
  condition: marketplaceCardSeeds[index].condition,
  custodyVerified: false,
  redemptionEligible: false,
  verificationId: ""
}));

export const initialMarketplaceListings: MarketplaceListing[] = vaultInventory.map(
  (inventory, index) => ({
    id: `listing-${String(index + 1).padStart(3, "0")}`,
    inventoryId: inventory.id,
    fixedPrice: marketplaceCardSeeds[index].price,
    status: "Available",
    listedAt: new Date(Date.UTC(2026, 6, 10, 12, 0) - index * 73 * 60 * 1000).toISOString()
  })
);

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
      listing
    }];
  });
}
