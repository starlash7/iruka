import { getAddress, isAddress, isHex, type Address, type Hex } from "viem";
import { activeChain as giwaSepolia, getDeploymentStorageKey } from "./activeDeployment.ts";

type PendingTransferStorage = Pick<
  Storage,
  "getItem" | "removeItem" | "setItem"
>;

export type PendingGiwaTransfer = {
  chainId: number;
  direction: "deposit" | "withdraw";
  submittedAt: string;
  transactionHash: Hex;
  walletAddress: Address;
};

type CreatePendingGiwaTransferInput = Pick<
  PendingGiwaTransfer,
  "direction" | "transactionHash"
> & {
  walletAddress: string;
};

function getPendingTransferKey(walletAddress: string) {
  return getDeploymentStorageKey("transfer", walletAddress);
}

function isTransactionHash(value: unknown): value is Hex {
  return typeof value === "string" && isHex(value) && value.length === 66;
}

function isPendingGiwaTransfer(
  value: unknown
): value is PendingGiwaTransfer {
  if (!value || typeof value !== "object") return false;
  const transfer = value as Partial<PendingGiwaTransfer>;

  return (
    transfer.chainId === giwaSepolia.id
    && (transfer.direction === "deposit" || transfer.direction === "withdraw")
    && typeof transfer.submittedAt === "string"
    && isAddress(transfer.walletAddress ?? "")
    && isTransactionHash(transfer.transactionHash)
  );
}

export function createPendingGiwaTransfer(
  input: CreatePendingGiwaTransferInput
): PendingGiwaTransfer {
  if (
    !isAddress(input.walletAddress)
    || !isTransactionHash(input.transactionHash)
  ) {
    throw new TypeError("Invalid GIWA transfer submission");
  }

  return {
    ...input,
    chainId: giwaSepolia.id,
    submittedAt: new Date().toISOString(),
    walletAddress: getAddress(input.walletAddress)
  };
}

export function savePendingGiwaTransfer(
  storage: PendingTransferStorage,
  transfer: PendingGiwaTransfer
) {
  try {
    storage.setItem(
      getPendingTransferKey(transfer.walletAddress),
      JSON.stringify(transfer)
    );
  } catch {
    // Confirmation continues in memory when browser storage is unavailable.
  }
}

export function getPendingGiwaTransfer(
  storage: PendingTransferStorage,
  walletAddress: string
) {
  if (!isAddress(walletAddress)) return undefined;
  const key = getPendingTransferKey(walletAddress);

  try {
    const storedValue = storage.getItem(key);
    if (!storedValue) return undefined;
    const transfer: unknown = JSON.parse(storedValue);
    if (
      !isPendingGiwaTransfer(transfer)
      || transfer.walletAddress.toLowerCase() !== walletAddress.toLowerCase()
    ) {
      try {
        storage.removeItem(key);
      } catch {
        // Ignore storage cleanup failures.
      }
      return undefined;
    }
    return transfer;
  } catch {
    try {
      storage.removeItem(key);
    } catch {
      // Ignore storage cleanup failures.
    }
    return undefined;
  }
}

export function clearPendingGiwaTransfer(
  storage: PendingTransferStorage,
  walletAddress: string,
  transactionHash?: Hex
) {
  const transfer = getPendingGiwaTransfer(storage, walletAddress);
  if (
    !transfer
    || (
      transactionHash
      && transfer.transactionHash.toLowerCase() !== transactionHash.toLowerCase()
    )
  ) {
    return;
  }

  try {
    storage.removeItem(getPendingTransferKey(walletAddress));
  } catch {
    // The in-memory pending state is cleared by the caller.
  }
}
