import { isStoredPullReceipt } from "./pullReceiptStorage.ts";
import { isAddress } from "viem";
import { getDeploymentStorageKey } from "./activeDeployment.ts";
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
  return getDeploymentStorageKey("collection", walletAddress);
}

function isCardPull(value: unknown, walletAddress: string): value is CardPull {
  if (!value || typeof value !== "object") return false;
  const card = value as Partial<CardPull>;

  return (
    (card.onchainReceipt === undefined || (
      isStoredPullReceipt(card.onchainReceipt)
      && (!card.onchainReceipt.collector
        || card.onchainReceipt.collector.toLowerCase() === walletAddress.toLowerCase())
    ))
    && card.category === "K-pop"
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
    return Array.isArray(cards) ? cards.filter((card) => isCardPull(card, walletAddress)) : [];
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
    storage.setItem(getCollectionKey(walletAddress), JSON.stringify(cards.filter((card) => isCardPull(card, walletAddress))));
  } catch {
    // The revealed card remains available in memory when storage is blocked.
  }
}
