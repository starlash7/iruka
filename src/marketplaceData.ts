export type MarketplaceCategory = "K-pop" | "TCG";
export type MarketplaceRarity = "Common" | "Rare" | "Epic" | "Legendary" | "Iruka";

export type MarketplaceCard = {
  category: MarketplaceCategory;
  fmv: number;
  grade: string;
  group: string;
  id: string;
  member: string;
  points: string;
  price: number;
  rarity: MarketplaceRarity;
  serial: string;
  title: string;
  tone: string;
};

export const marketplaceCards: MarketplaceCard[] = [
  {
    id: "market-aurora-mina",
    title: "Aurora Stage Mina",
    group: "Aurora",
    member: "Mina",
    category: "K-pop",
    rarity: "Iruka",
    price: 218000,
    fmv: 240000,
    grade: "IRK Vault 10",
    serial: "IRK-4211",
    points: "+80 pts",
    tone: "aqua"
  },
  {
    id: "market-velvet-yuri",
    title: "Velvet Signal Yuri",
    group: "Velvet",
    member: "Yuri",
    category: "K-pop",
    rarity: "Legendary",
    price: 164000,
    fmv: 188000,
    grade: "IRK Vault 9",
    serial: "IRK-3019",
    points: "+72 pts",
    tone: "smoke"
  },
  {
    id: "market-blue-rin",
    title: "Blue Hour Rin",
    group: "Prism",
    member: "Rin",
    category: "K-pop",
    rarity: "Epic",
    price: 86000,
    fmv: 98000,
    grade: "IRK Vault 8",
    serial: "IRK-8842",
    points: "+54 pts",
    tone: "cyan"
  },
  {
    id: "market-sync-hana",
    title: "Sync Live Hana",
    group: "Signal",
    member: "Hana",
    category: "K-pop",
    rarity: "Rare",
    price: 52000,
    fmv: 57000,
    grade: "IRK Vault 8",
    serial: "IRK-7180",
    points: "+38 pts",
    tone: "mint"
  },
  {
    id: "market-holo-starter",
    title: "Holo Starter Slab",
    group: "Kanto Vault",
    member: "Holo Starter",
    category: "TCG",
    rarity: "Legendary",
    price: 320000,
    fmv: 350000,
    grade: "IRK Vault 10",
    serial: "IRK-6625",
    points: "+83 pts",
    tone: "rose"
  },
  {
    id: "market-foil-trainer",
    title: "Foil Trainer Vault",
    group: "Mint Lab",
    member: "Foil Trainer",
    category: "TCG",
    rarity: "Epic",
    price: 144000,
    fmv: 156000,
    grade: "IRK Vault 9",
    serial: "IRK-2091",
    points: "+61 pts",
    tone: "aqua"
  }
];
