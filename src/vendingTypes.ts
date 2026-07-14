export type Category = "K-pop" | "TCG";
export type Rarity = "Common" | "Rare" | "Epic" | "Legendary" | "Iruka";
export type VaultStatus = "Vaulted" | "Listed" | "Sold" | "Redeem queued";

export type RarityConfig = {
  odds: number;
  rarity: Rarity;
  valueRange: [number, number];
};

export type ChaseCard = {
  estimatedValue: number;
  id: string;
  imageUrl: string;
  rarity: Rarity;
};

export type Pack = {
  category: Category;
  chaseCards: ChaseCard[];
  heroImage: string;
  id: string;
  name: string;
  odds: RarityConfig[];
  price: number;
  remaining: number;
  shortName: string;
  total: number;
};

export type PackCopy = {
  chaseCards: string[];
  name: string;
  shortName: string;
};

export type CardPull = {
  category: Category;
  estimatedValue: number;
  group: string;
  id: string;
  imageUrl?: string;
  imageStyle: string;
  marketplaceInventoryId?: string;
  member: string;
  packId: string;
  pulledAt: string;
  rarity: Rarity;
  serial: string;
  vaultStatus: VaultStatus;
};
