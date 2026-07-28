import { isAddress } from "viem";
import { giwaSepolia } from "./giwaChain.ts";
import type { CardPull, Rarity, VaultStatus } from "./vendingTypes.ts";

type CollectionStorage = Pick<Storage, "getItem" | "removeItem" | "setItem">;

const rarities = new Set<Rarity>([
  "Common",
  "Rare",
  "Epic",
  "Legendary",
  "Iruka"
]);
const vaultStatuses = new Set<VaultStatus>([
  "Pulled",
  "Vaulted",
  "Listed",
  "Sold",
  "Redeem queued"
]);

function getCollectionKey(walletAddress: string) {
  return `iruka:collection:${giwaSepolia.id}:${walletAddress.toLowerCase()}`;
}

function isCardPull(value: unknown): value is CardPull {
  if (!value || typeof value !== "object") return false;
  const card = value as Partial<CardPull>;

  return (
    card.category === "K-pop"
    && typeof card.estimatedValue === "number"
    && Number.isFinite(card.estimatedValue)
    && typeof card.group === "string"
    && typeof card.id === "string"
    && typeof card.imageStyle === "string"
    && typeof card.member === "string"
    && typeof card.packId === "string"
    && typeof card.pulledAt === "string"
    && typeof card.serial === "string"
    && rarities.has(card.rarity as Rarity)
    && vaultStatuses.has(card.vaultStatus as VaultStatus)
  );
}

export function getWalletCardCollection(
  storage: CollectionStorage,
  walletAddress: string
): CardPull[] {
  if (!isAddress(walletAddress)) return [];
  const key = getCollectionKey(walletAddress);

  try {
    const storedValue = storage.getItem(key);
    if (!storedValue) return [];
    const cards: unknown = JSON.parse(storedValue);
    return Array.isArray(cards) ? cards.filter(isCardPull) : [];
  } catch {
    try {
      storage.removeItem(key);
    } catch {
      // Storage availability must not block account rendering.
    }
    return [];
  }
}

export function saveWalletCardCollection(
  storage: CollectionStorage,
  walletAddress: string,
  cards: readonly CardPull[]
) {
  if (!isAddress(walletAddress)) return;
  try {
    storage.setItem(getCollectionKey(walletAddress), JSON.stringify(cards));
  } catch {
    // The revealed card remains available in memory when storage is blocked.
  }
}
