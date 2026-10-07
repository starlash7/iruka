import { isAddress, isHex, type Address, type Hex } from "viem";
import { activeDeployment } from "./activeDeployment.ts";
import type { GiwaPullReceipt } from "./giwaPull.ts";
import type { GiwaPullFulfillment } from "./giwaFulfillment.ts";

export type StoredPullReceipt = {
  deployment: "giwa" | "monad";
  chainId: number;
  collector?: Address;
  contractAddress: Address;
  batchId: Hex;
  drawIndex: number;
  requestId: string;
  requestBlockNumber: string;
  requestTransactionHash: Hex;
  fulfillmentTransactionHash: Hex;
  fulfillmentBlockNumber?: string;
  inventoryId: Hex;
  inventoryIndex: number;
};

export function createStoredPullReceipt(
  receipt: GiwaPullReceipt,
  fulfillment: GiwaPullFulfillment
): StoredPullReceipt {
  return {
    deployment: activeDeployment.id,
    chainId: activeDeployment.chain.id,
    ...(receipt.collector ? { collector: receipt.collector } : {}),
    contractAddress: receipt.contractAddress,
    batchId: receipt.batchId,
    drawIndex: receipt.drawIndex,
    requestId: receipt.requestId.toString(),
    requestBlockNumber: receipt.requestBlockNumber.toString(),
    requestTransactionHash: receipt.requestTransactionHash,
    fulfillmentTransactionHash: fulfillment.fulfillmentTransactionHash,
    ...(fulfillment.fulfillmentBlockNumber === undefined ? {} : {
      fulfillmentBlockNumber: fulfillment.fulfillmentBlockNumber.toString()
    }),
    inventoryId: fulfillment.inventoryId,
    inventoryIndex: fulfillment.inventoryIndex
  };
}

export function isStoredPullReceipt(value: unknown): value is StoredPullReceipt {
  if (!value || typeof value !== "object") return false;
  const receipt = value as Partial<StoredPullReceipt>;
  const isBytes32 = (candidate: unknown) => typeof candidate === "string"
    && isHex(candidate) && candidate.length === 66;
  const isDecimal = (candidate: unknown) => typeof candidate === "string"
    && /^\d+$/.test(candidate);

  return receipt.deployment === activeDeployment.id
    && receipt.chainId === activeDeployment.chain.id
    && isAddress(receipt.contractAddress ?? "")
    && (receipt.collector === undefined || isAddress(receipt.collector))
    && isBytes32(receipt.batchId)
    && isBytes32(receipt.inventoryId)
    && isBytes32(receipt.requestTransactionHash)
    && isBytes32(receipt.fulfillmentTransactionHash)
    && Number.isSafeInteger(receipt.drawIndex) && receipt.drawIndex! >= 0
    && Number.isSafeInteger(receipt.inventoryIndex) && receipt.inventoryIndex! >= 0
    && isDecimal(receipt.requestId) && BigInt(receipt.requestId!) > 0n
    && isDecimal(receipt.requestBlockNumber)
    && (receipt.fulfillmentBlockNumber === undefined || isDecimal(receipt.fulfillmentBlockNumber));
}

export function getStoredRevealReceipt(
  receipt: StoredPullReceipt | undefined,
  walletAddress: string | undefined
) {
  if (!receipt || !isStoredPullReceipt(receipt) || !walletAddress
    || receipt.collector?.toLowerCase() !== walletAddress.toLowerCase()) {
    return undefined;
  }
  return {
    explorerUrl: `${activeDeployment.chain.blockExplorers.default.url}/tx/${receipt.fulfillmentTransactionHash}`,
    requestId: BigInt(receipt.requestId)
  };
}
