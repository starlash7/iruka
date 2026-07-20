import type {
  PackMedia,
  PackTier,
  RarityOdds,
  RarityTier,
  UsdcAmount
} from "./vendingTypes";

export type PackFixture = {
  batchId: string;
  configuredAvailability?: "coming-soon";
  id: string;
  priceUsdc: UsdcAmount;
  rarityOdds: readonly RarityOdds[];
  remaining: number;
  tier: PackTier;
  total: number;
};

export const rarityTiers: readonly RarityTier[] = ["Common", "Rare", "Epic", "Legendary", "Iruka"];
export const snapshotAt = "2026-07-16T00:00:00.000Z";

export const packMedia: Record<PackTier, PackMedia> = {
  Debut: {
    coverUrl: new URL("./assets/iruka-pack-debut.webp", import.meta.url).href,
    packFrontUrl: new URL("./assets/iruka-pack-debut.webp", import.meta.url).href,
    packBackUrl: new URL("./assets/iruka-pack-product.jpg", import.meta.url).href
  },
  Stage: {
    coverUrl: new URL("./assets/iruka-pack-stage.webp", import.meta.url).href,
    packFrontUrl: new URL("./assets/iruka-pack-stage.webp", import.meta.url).href,
    packBackUrl: new URL("./assets/iruka-pack-product.jpg", import.meta.url).href
  },
  Encore: {
    coverUrl: new URL("./assets/iruka-pack-encore.webp", import.meta.url).href,
    packFrontUrl: new URL("./assets/iruka-pack-encore.webp", import.meta.url).href,
    packBackUrl: new URL("./assets/iruka-pack-product.jpg", import.meta.url).href
  },
  Grail: {
    coverUrl: new URL("./assets/iruka-pack-grail.webp", import.meta.url).href,
    packFrontUrl: new URL("./assets/iruka-pack-grail.webp", import.meta.url).href,
    packBackUrl: new URL("./assets/iruka-pack-product.jpg", import.meta.url).href
  }
};

export const packFixtures: readonly PackFixture[] = [
  {
    id: "debut", tier: "Debut", batchId: "IRK-GG-2026-001", priceUsdc: "19.00",
    remaining: 84, total: 120,
    rarityOdds: [
      { tier: "Common", basisPoints: 6000, eligibleCount: 72, estimatedValueRangeUsdc: ["6.00", "18.00"] },
      { tier: "Rare", basisPoints: 2800, eligibleCount: 34, estimatedValueRangeUsdc: ["21.00", "57.00"] },
      { tier: "Epic", basisPoints: 900, eligibleCount: 11, estimatedValueRangeUsdc: ["71.00", "214.00"] },
      { tier: "Legendary", basisPoints: 200, eligibleCount: 2, estimatedValueRangeUsdc: ["357.00", "857.00"] },
      { tier: "Iruka", basisPoints: 100, eligibleCount: 1, estimatedValueRangeUsdc: ["1071.00", "2143.00"] }
    ]
  },
  {
    id: "stage", tier: "Stage", batchId: "IRK-GG-2026-002", priceUsdc: "29.00",
    remaining: 10, total: 100,
    rarityOdds: [
      { tier: "Common", basisPoints: 5800, eligibleCount: 58, estimatedValueRangeUsdc: ["6.00", "20.00"] },
      { tier: "Rare", basisPoints: 2900, eligibleCount: 29, estimatedValueRangeUsdc: ["25.00", "64.00"] },
      { tier: "Epic", basisPoints: 1000, eligibleCount: 10, estimatedValueRangeUsdc: ["86.00", "243.00"] },
      { tier: "Legendary", basisPoints: 200, eligibleCount: 2, estimatedValueRangeUsdc: ["464.00", "1071.00"] },
      { tier: "Iruka", basisPoints: 100, eligibleCount: 1, estimatedValueRangeUsdc: ["1214.00", "2429.00"] }
    ]
  },
  {
    id: "encore", tier: "Encore", batchId: "IRK-GG-2026-003", priceUsdc: "39.00",
    remaining: 0, total: 80,
    rarityOdds: [
      { tier: "Common", basisPoints: 5200, eligibleCount: 42, estimatedValueRangeUsdc: ["9.00", "23.00"] },
      { tier: "Rare", basisPoints: 3300, eligibleCount: 26, estimatedValueRangeUsdc: ["30.00", "79.00"] },
      { tier: "Epic", basisPoints: 1100, eligibleCount: 9, estimatedValueRangeUsdc: ["93.00", "271.00"] },
      { tier: "Legendary", basisPoints: 300, eligibleCount: 2, estimatedValueRangeUsdc: ["500.00", "1143.00"] },
      { tier: "Iruka", basisPoints: 100, eligibleCount: 1, estimatedValueRangeUsdc: ["1286.00", "2571.00"] }
    ]
  },
  {
    id: "grail", tier: "Grail", batchId: "IRK-GG-2026-004", priceUsdc: "59.00",
    remaining: 24, total: 60, configuredAvailability: "coming-soon",
    rarityOdds: [
      { tier: "Common", basisPoints: 5000, eligibleCount: 30, estimatedValueRangeUsdc: ["21.00", "50.00"] },
      { tier: "Rare", basisPoints: 3200, eligibleCount: 19, estimatedValueRangeUsdc: ["61.00", "129.00"] },
      { tier: "Epic", basisPoints: 1300, eligibleCount: 8, estimatedValueRangeUsdc: ["157.00", "393.00"] },
      { tier: "Legendary", basisPoints: 400, eligibleCount: 2, estimatedValueRangeUsdc: ["643.00", "1714.00"] },
      { tier: "Iruka", basisPoints: 100, eligibleCount: 1, estimatedValueRangeUsdc: ["1857.00", "3714.00"] }
    ]
  }
];
