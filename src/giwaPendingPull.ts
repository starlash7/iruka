import { getAddress, isAddress, isHex, type Address, type Hex } from "viem";
import { giwaSepolia } from "./giwaChain.ts";
import {
  getGiwaExplorerTransactionUrl,
  type GiwaPullReceipt
} from "./giwaPull.ts";

type PendingPullStorage = Pick<Storage, "getItem" | "removeItem" | "setItem">;

export type PendingGiwaPull = {
  batchId: Hex;
  chainId: number;
  contractAddress: Address;
  drawIndex?: number;
  packId: string;
  requestBlockNumber?: string;
  requestId?: string;
  requestTransactionHash: Hex;
  submittedAt: string;
  walletAddress: Address;
};

type CreatePendingGiwaPullInput = Pick<
  PendingGiwaPull,
  "batchId" | "contractAddress" | "packId" | "requestTransactionHash"
> & {
  walletAddress: string;
};

function getPendingPullKey(walletAddress: string) {
  return `iruka:giwa-pull:${giwaSepolia.id}:${walletAddress.toLowerCase()}`;
}

function isBytes32(value: unknown): value is Hex {
  return typeof value === "string" && isHex(value) && value.length === 66;
}

function isPendingGiwaPull(value: unknown): value is PendingGiwaPull {
  if (!value || typeof value !== "object") return false;
  const pull = value as Partial<PendingGiwaPull>;

  return (
    pull.chainId === giwaSepolia.id
    && typeof pull.packId === "string"
    && pull.packId.length > 0
    && typeof pull.submittedAt === "string"
    && isAddress(pull.walletAddress ?? "")
    && isAddress(pull.contractAddress ?? "")
    && isBytes32(pull.batchId)
    && isBytes32(pull.requestTransactionHash)
    && (pull.drawIndex === undefined
      || (Number.isSafeInteger(pull.drawIndex) && pull.drawIndex >= 0))
    && (pull.requestBlockNumber === undefined
      || /^\d+$/.test(pull.requestBlockNumber))
    && (pull.requestId === undefined || /^\d+$/.test(pull.requestId))
  );
}

export function createPendingGiwaPull(
  input: CreatePendingGiwaPullInput
): PendingGiwaPull {
  if (
    !isAddress(input.walletAddress)
    || !isAddress(input.contractAddress)
    || !isBytes32(input.batchId)
    || !isBytes32(input.requestTransactionHash)
  ) {
    throw new TypeError("Invalid GIWA pull submission");
  }

  return {
    ...input,
    chainId: giwaSepolia.id,
    contractAddress: getAddress(input.contractAddress),
    submittedAt: new Date().toISOString(),
    walletAddress: getAddress(input.walletAddress)
  };
}

export function savePendingGiwaPull(
  storage: PendingPullStorage,
  pendingPull: PendingGiwaPull
) {
  try {
    storage.setItem(
      getPendingPullKey(pendingPull.walletAddress),
      JSON.stringify(pendingPull)
    );
  } catch {
    // Confirmation continues in memory when browser storage is unavailable.
  }
}

export function getPendingGiwaPull(
  storage: PendingPullStorage,
  walletAddress: string
) {
  if (!isAddress(walletAddress)) return undefined;
  const key = getPendingPullKey(walletAddress);

  try {
    const storedValue = storage.getItem(key);
    if (!storedValue) return undefined;
    const pendingPull: unknown = JSON.parse(storedValue);
    if (
      !isPendingGiwaPull(pendingPull)
      || pendingPull.walletAddress.toLowerCase() !== walletAddress.toLowerCase()
    ) {
      try {
        storage.removeItem(key);
      } catch {
        // Ignore storage cleanup failures.
      }
      return undefined;
    }
    return pendingPull;
  } catch {
    try {
      storage.removeItem(key);
    } catch {
      // Ignore storage cleanup failures.
    }
    return undefined;
  }
}

export function clearPendingGiwaPull(
  storage: PendingPullStorage,
  walletAddress: string,
  transactionHash?: Hex
) {
  const pendingPull = getPendingGiwaPull(storage, walletAddress);
  if (
    !pendingPull
    || (
      transactionHash
      && pendingPull.requestTransactionHash.toLowerCase()
        !== transactionHash.toLowerCase()
    )
  ) {
    return;
  }

  try {
    storage.removeItem(getPendingPullKey(walletAddress));
  } catch {
    // The in-memory pending state is cleared by the caller.
  }
}

export function getPendingGiwaPullReceipt(
  pendingPull: PendingGiwaPull
): GiwaPullReceipt | undefined {
  if (
    pendingPull.drawIndex === undefined
    || pendingPull.requestBlockNumber === undefined
    || pendingPull.requestId === undefined
  ) {
    return undefined;
  }

  return {
    batchId: pendingPull.batchId,
    contractAddress: pendingPull.contractAddress,
    drawIndex: pendingPull.drawIndex,
    explorerUrl: getGiwaExplorerTransactionUrl(
      pendingPull.requestTransactionHash
    ),
    requestBlockNumber: BigInt(pendingPull.requestBlockNumber),
    requestId: BigInt(pendingPull.requestId),
    requestTransactionHash: pendingPull.requestTransactionHash
  };
}

export function confirmPendingGiwaPull(
  pendingPull: PendingGiwaPull,
  receipt: GiwaPullReceipt
): PendingGiwaPull {
  return {
    ...pendingPull,
    drawIndex: receipt.drawIndex,
    requestBlockNumber: receipt.requestBlockNumber.toString(),
    requestId: receipt.requestId.toString(),
    requestTransactionHash: receipt.requestTransactionHash
  };
}
