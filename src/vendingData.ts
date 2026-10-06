import { activeDeployment } from "./activeDeployment.ts";
import type {
  InventoryCard,
  InventoryPage,
  InventoryQuery,
  PackAvailability,
  PackDetail,
  PullPackOptions,
  PackSummary,
  RarityOdds,
  RarityTier,
  VendingPull
} from "./vendingTypes";
import {
  packFixtures,
  packMedia,
  snapshotAt,
  type PackFixture
} from "./vendingFixtures.ts";
import { pullCardAssets } from "./pullCardAssets.ts";

type AvailabilityInput = {
  configured?: "coming-soon";
  remaining: number;
  total: number;
};

const catalogCardCounts: Record<RarityTier, number> = {
  Common: 6,
  Rare: 6,
  Epic: 5,
  Legendary: 2,
  Iruka: 1
};

const catalogRarityOrder: readonly RarityTier[] = [
  "Common", "Rare", "Epic", "Legendary", "Iruka",
  "Common", "Rare", "Epic", "Legendary",
  "Common", "Rare", "Epic",
  "Common", "Rare", "Epic",
  "Common", "Rare", "Epic",
  "Common", "Rare"
];

function createCatalogCards(fixture: PackFixture): readonly InventoryCard[] {
  const raritySequences: Record<RarityTier, number> = {
    Common: 0,
    Rare: 0,
    Epic: 0,
    Legendary: 0,
    Iruka: 0
  };

  return pullCardAssets.map((cardAsset, index) => {
    const tier = catalogRarityOrder[index];
    const odds = fixture.rarityOdds.find((entry) => entry.tier === tier)!;
    const raritySequence = raritySequences[tier]++;
    const cardCount = catalogCardCounts[tier];
    const sequence = index + 1;

    return {
      id: `${fixture.id}-catalog-${String(sequence).padStart(3, "0")}`,
      packId: fixture.id,
      title: cardAsset.title,
      tier,
      serial: `IRK-${fixture.id.toUpperCase()}-${String(sequence).padStart(4, "0")}`,
      estimatedValueRangeUsdc: odds.estimatedValueRangeUsdc,
      individualOddsBasisPoints: Math.floor(odds.basisPoints / cardCount)
        + (raritySequence < odds.basisPoints % cardCount ? 1 : 0),
      media: {
        backUrl: cardAsset.imageUrl,
        frontUrl: cardAsset.imageUrl
      },
      redemption: { eligible: false, shipmentAvailable: false }
    };
  });
}

function createInventoryCards(fixture: PackFixture): readonly InventoryCard[] {
  const catalog = createCatalogCards(fixture);
  const entries = fixture.rarityOdds.flatMap((odds, rarityIndex) => {
    const tierCards = catalog.filter((card) => card.tier === odds.tier);

    return Array.from({ length: odds.eligibleCount }, (_, raritySequence) => ({
      card: tierCards[raritySequence % tierCards.length],
      individualOddsBasisPoints: Math.floor(odds.basisPoints / odds.eligibleCount)
        + (raritySequence < odds.basisPoints % odds.eligibleCount ? 1 : 0),
      odds,
      rarityIndex,
      raritySequence
    }));
  });

  return entries
    .sort((a, b) => a.raritySequence - b.raritySequence || a.rarityIndex - b.rarityIndex)
    .map(({ card, individualOddsBasisPoints, odds }, index) => {
      const sequence = index + 1;

      return {
        id: `${fixture.id}-inventory-${String(sequence).padStart(3, "0")}`,
        packId: fixture.id,
        title: card.title,
        tier: odds.tier,
        serial: `IRK-${fixture.id.toUpperCase()}-${String(sequence).padStart(4, "0")}`,
        estimatedValueRangeUsdc: odds.estimatedValueRangeUsdc,
        individualOddsBasisPoints,
        media: card.media,
        redemption: { eligible: false, shipmentAvailable: false }
      };
    });
}

export function getAvailability({ configured, remaining, total }: AvailabilityInput): PackAvailability {
  if (configured === "coming-soon") return "coming-soon";
  if (remaining === 0) return "sold-out";
  if (total > 0 && remaining / total <= 0.1) return "low-stock";
  return "live";
}

export function selectRarityByBasisPoints(
  rarityOdds: readonly RarityOdds[],
  roll: number
): RarityTier {
  if (!Number.isFinite(roll) || roll < 0 || roll >= 1) {
    throw new RangeError("Rarity roll must be greater than or equal to 0 and less than 1");
  }

  const target = Math.floor(roll * 10000);
  let cursor = 0;

  for (const odds of rarityOdds) {
    cursor += odds.basisPoints;
    if (target < cursor) return odds.tier;
  }

  throw new RangeError("Rarity odds must total 10000 basis points");
}

function createPackDetail(fixture: PackFixture): PackDetail {
  const catalog = createCatalogCards(fixture);

  return {
    id: fixture.id,
    name: fixture.tier,
    tier: fixture.tier,
    category: "Girl Group",
    priceUsdc: fixture.priceUsdc,
    supply: { remaining: fixture.remaining, total: fixture.total },
    status: getAvailability({
      configured: fixture.configuredAvailability,
      remaining: fixture.remaining,
      total: fixture.total
    }),
    media: packMedia[fixture.tier],
    batchId: fixture.id === activeDeployment.packId ? activeDeployment.batchLabel : fixture.batchId,
    snapshotAt,
    redemption: { eligible: false, shipmentAvailable: false },
    rarityOdds: fixture.rarityOdds,
    featuredInventory: catalog.slice(0, 8)
  };
}

export const packDetails: readonly PackDetail[] = packFixtures.map(createPackDetail);
const inventoryByPack = new Map(
  packFixtures.map((fixture) => [fixture.id, createInventoryCards(fixture)])
);
const catalogByPack = new Map(
  packFixtures.map((fixture) => [fixture.id, createCatalogCards(fixture)])
);

export async function listPacks(): Promise<readonly PackSummary[]> {
  return packDetails.map((pack) => ({
    id: pack.id,
    name: pack.name,
    tier: pack.tier,
    category: pack.category,
    priceUsdc: pack.priceUsdc,
    supply: pack.supply,
    status: pack.status,
    media: pack.media
  }));
}

export async function getPackDetail(packId: string): Promise<PackDetail | undefined> {
  return packDetails.find((pack) => pack.id === packId);
}

export async function getPackInventory(
  packId: string,
  { catalog = false, cursor = 0, limit = 24, rarity }: InventoryQuery = {}
): Promise<InventoryPage> {
  const fullInventory = (catalog ? catalogByPack : inventoryByPack).get(packId) ?? [];
  const inventory = rarity
    ? fullInventory.filter((card) => card.tier === rarity)
    : fullInventory;
  const start = Math.max(cursor, 0);
  const items = inventory.slice(start, start + Math.max(limit, 0));
  const nextCursor = start + items.length;

  return {
    items,
    total: inventory.length,
    ...(nextCursor < inventory.length ? { nextCursor } : {})
  };
}

export async function listRecentPulls(
  sessionPulls: readonly VendingPull[]
): Promise<readonly VendingPull[]> {
  return [...sessionPulls];
}

export async function pullPack(
  packId: string,
  { excludedCardIds = [] }: PullPackOptions = {}
): Promise<VendingPull> {
  if (!activeDeployment.allowFixturePull) throw new Error("Monad pulls require onchain fulfillment");
  const detail = await getPackDetail(packId);
  const inventory = inventoryByPack.get(packId);

  if (!detail || !inventory) throw new RangeError(`Unknown pack: ${packId}`);
  const excludedIds = new Set(excludedCardIds);
  const availableCards = inventory.filter((card) => !excludedIds.has(card.id));
  const availableOdds = detail.rarityOdds.map((odds) => ({
    basisPoints: availableCards
      .filter((card) => card.tier === odds.tier)
      .reduce((total, card) => total + card.individualOddsBasisPoints, 0),
    tier: odds.tier
  }));
  const availableBasisPoints = availableOdds.reduce(
    (total, odds) => total + odds.basisPoints,
    0
  );

  if (availableBasisPoints === 0) {
    throw new RangeError(`No inventory remains for pack: ${packId}`);
  }

  const tierTarget = Math.floor(Math.random() * availableBasisPoints);
  let tierCursor = 0;
  const selectedTier = availableOdds.find((odds) => {
    tierCursor += odds.basisPoints;
    return tierTarget < tierCursor;
  })?.tier;
  const eligibleCards = availableCards.filter((card) => card.tier === selectedTier);

  if (!selectedTier || eligibleCards.length === 0) {
    throw new RangeError(`No eligible ${selectedTier} inventory for pack: ${packId}`);
  }

  const tierBasisPoints = eligibleCards.reduce(
    (total, card) => total + card.individualOddsBasisPoints,
    0
  );
  const cardTarget = Math.floor(Math.random() * tierBasisPoints);
  let cardCursor = 0;
  const card = eligibleCards.find((candidate) => {
    cardCursor += candidate.individualOddsBasisPoints;
    return cardTarget < cardCursor;
  });

  if (!card) throw new RangeError(`Inventory odds do not reconcile for pack: ${packId}`);

  return {
    id: `${packId}-pull-${Date.now()}-${Math.round(Math.random() * 10000)}`,
    packId,
    card,
    pulledAt: new Date().toISOString()
  };
}
