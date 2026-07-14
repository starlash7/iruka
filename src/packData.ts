import girlGroupPackImage from "./assets/girl-group-iruka-pack.jpg";
import packProductImage from "./assets/iruka-pack-product.jpg";
import type { ChaseCard, Pack, Rarity } from "./vendingTypes";

function createChaseCards(packId: string, values: [number, number, number, number]): ChaseCard[] {
  const rarities: Rarity[] = ["Iruka", "Legendary", "Epic", "Rare"];

  return values.map((estimatedValue, index) => ({
    estimatedValue,
    id: `${packId}-chase-${index + 1}`,
    imageUrl: packProductImage,
    rarity: rarities[index]
  }));
}

export const packs: Pack[] = [
  {
    id: "girl-grail",
    name: "Girl Group Iruka Pack",
    shortName: "Girl Group",
    category: "K-pop",
    price: 29,
    remaining: 84,
    total: 120,
    heroImage: girlGroupPackImage,
    chaseCards: createChaseCards("girl-grail", [1071, 857, 214, 57]),
    odds: [
      { rarity: "Common", odds: 60, valueRange: [6, 18] },
      { rarity: "Rare", odds: 28, valueRange: [21, 57] },
      { rarity: "Epic", odds: 9, valueRange: [71, 214] },
      { rarity: "Legendary", odds: 2, valueRange: [357, 857] },
      { rarity: "Iruka", odds: 1, valueRange: [1071, 2143] }
    ]
  },
  {
    id: "boy-grail",
    name: "Boy Group Iruka Pack",
    shortName: "Boy Group",
    category: "K-pop",
    price: 32,
    remaining: 66,
    total: 100,
    heroImage: packProductImage,
    chaseCards: createChaseCards("boy-grail", [1214, 1071, 243, 64]),
    odds: [
      { rarity: "Common", odds: 58, valueRange: [6, 20] },
      { rarity: "Rare", odds: 29, valueRange: [25, 64] },
      { rarity: "Epic", odds: 10, valueRange: [86, 243] },
      { rarity: "Legendary", odds: 2, valueRange: [464, 1071] },
      { rarity: "Iruka", odds: 1, valueRange: [1214, 2429] }
    ]
  },
  {
    id: "ive-drop",
    name: "Premium Idol Drop #001",
    shortName: "Premium Idol",
    category: "K-pop",
    price: 43,
    remaining: 31,
    total: 60,
    heroImage: packProductImage,
    chaseCards: createChaseCards("ive-drop", [1286, 1143, 271, 79]),
    odds: [
      { rarity: "Common", odds: 52, valueRange: [9, 23] },
      { rarity: "Rare", odds: 33, valueRange: [30, 79] },
      { rarity: "Epic", odds: 11, valueRange: [93, 271] },
      { rarity: "Legendary", odds: 3, valueRange: [500, 1143] },
      { rarity: "Iruka", odds: 1, valueRange: [1286, 2571] }
    ]
  },
  {
    id: "aespa-drop",
    name: "Rookie Idol Drop #001",
    shortName: "Rookie Idol",
    category: "K-pop",
    price: 39,
    remaining: 44,
    total: 70,
    heroImage: packProductImage,
    chaseCards: createChaseCards("aespa-drop", [1143, 1000, 257, 75]),
    odds: [
      { rarity: "Common", odds: 54, valueRange: [7, 21] },
      { rarity: "Rare", odds: 31, valueRange: [27, 75] },
      { rarity: "Epic", odds: 11, valueRange: [89, 257] },
      { rarity: "Legendary", odds: 3, valueRange: [464, 1000] },
      { rarity: "Iruka", odds: 1, valueRange: [1143, 2286] }
    ]
  },
  {
    id: "pokemon-slab",
    name: "TCG Slab Pack",
    shortName: "TCG Slab",
    category: "TCG",
    price: 64,
    remaining: 18,
    total: 40,
    heroImage: packProductImage,
    chaseCards: createChaseCards("pokemon-slab", [1857, 1714, 393, 129]),
    odds: [
      { rarity: "Common", odds: 50, valueRange: [21, 50] },
      { rarity: "Rare", odds: 32, valueRange: [61, 129] },
      { rarity: "Epic", odds: 13, valueRange: [157, 393] },
      { rarity: "Legendary", odds: 4, valueRange: [643, 1714] },
      { rarity: "Iruka", odds: 1, valueRange: [1857, 3714] }
    ]
  }
];

export const rarityClassNames: Record<Rarity, string> = {
  Common: "rarity-common",
  Rare: "rarity-rare",
  Epic: "rarity-epic",
  Legendary: "rarity-legendary",
  Iruka: "rarity-iruka"
};
