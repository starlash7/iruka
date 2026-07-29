export type UsdcAmount = `${number}.${number}`;
export type VendingCategory = "Girl Group";
export type PackTier = "Debut" | "Stage" | "Encore" | "Grail";
export type RarityTier = "Common" | "Rare" | "Epic" | "Legendary" | "Iruka";
export type PackAvailability = "live" | "low-stock" | "sold-out" | "coming-soon";

export type PackMedia = {
  coverUrl: string;
  packBackUrl: string;
  packFrontUrl: string;
};

export type CardMedia = {
  backUrl: string;
  frontUrl: string;
};

export type PackSupply = {
  remaining: number;
  total: number;
};

export type Redemption = {
  eligible: boolean;
  shipmentAvailable: boolean;
};

export type RarityOdds = {
  basisPoints: number;
  eligibleCount: number;
  estimatedValueRangeUsdc: readonly [UsdcAmount, UsdcAmount];
  tier: RarityTier;
};

export type InventoryCard = {
  estimatedValueRangeUsdc: readonly [UsdcAmount, UsdcAmount];
  id: string;
  individualOddsBasisPoints: number;
  media: CardMedia;
  packId: string;
  redemption: Redemption;
  serial: string;
  tier: RarityTier;
  title: string;
  verificationId?: string;
  certificateId?: string;
  grade?: string;
};

export type PackSummary = {
  category: VendingCategory;
  id: string;
  media: PackMedia;
  name: string;
  priceUsdc: UsdcAmount;
  status: PackAvailability;
  supply: PackSupply;
  tier: PackTier;
};

export type PackDetail = PackSummary & {
  batchId: string;
  featuredInventory: readonly InventoryCard[];
  rarityOdds: readonly RarityOdds[];
  redemption: Redemption;
  snapshotAt: string;
};

export type InventoryPage = {
  items: readonly InventoryCard[];
  nextCursor?: number;
  total: number;
};

export type InventoryQuery = {
  catalog?: boolean;
  cursor?: number;
  limit?: number;
  rarity?: RarityTier;
};

export type PullPackOptions = {
  excludedCardIds?: readonly string[];
};

export type VendingPull = {
  card: InventoryCard;
  id: string;
  packId: string;
  pulledAt: string;
};

// Legacy marketplace and pull-view category values remain until those views move to the Vending API.
export type Category = "K-pop" | "TCG";
export type Rarity = "Common" | "Rare" | "Epic" | "Legendary" | "Iruka";
export type VaultStatus =
  | "Pulled"
  | "Vaulted"
  | "Listed"
  | "Sold"
  | "Redeem queued";

export type CardPull = {
  category: Category;
  estimatedValue: number;
  estimatedValueRangeUsdc?: readonly [UsdcAmount, UsdcAmount];
  group: string;
  id: string;
  imageUrl?: string;
  imageStyle: string;
  inventoryCardId?: string;
  marketplaceInventoryId?: string;
  member: string;
  packId: string;
  pulledAt: string;
  rarity: Rarity;
  redemption?: Redemption;
  serial: string;
  vaultStatus: VaultStatus;
  verificationId?: string;
};
