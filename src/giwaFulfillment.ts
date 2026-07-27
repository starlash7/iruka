import { createPublicClient, http, type Hex } from "viem";
import { giwaSepolia } from "./giwaChain.ts";
import { giwaPackBatchAbi } from "./giwaPackBatch.ts";
import {
  getGiwaExplorerTransactionUrl,
  type GiwaPullReceipt
} from "./giwaPull.ts";

export type GiwaPullFulfillment = {
  explorerUrl: string;
  fulfillmentTransactionHash: Hex;
  inventoryId: Hex;
  inventoryIndex: number;
};

type WaitForFulfillmentOptions = {
  delay?: (milliseconds: number) => Promise<void>;
  pollIntervalMs?: number;
  readFulfillment?: (
    receipt: GiwaPullReceipt
  ) => Promise<GiwaPullFulfillment | undefined>;
  triggerFulfillment?: (receipt: GiwaPullReceipt) => Promise<void>;
  triggerIntervalMs?: number;
  timeoutMs?: number;
};

type KeeperFetch = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Pick<Response, "ok" | "status">>;

const publicClient = createPublicClient({
  chain: giwaSepolia,
  pollingInterval: 500,
  transport: http(giwaSepolia.rpcUrls.default.http[0])
});

export async function readGiwaPullFulfillment(
  receipt: GiwaPullReceipt
): Promise<GiwaPullFulfillment | undefined> {
  const pull = await publicClient.readContract({
    address: receipt.contractAddress,
    abi: giwaPackBatchAbi,
    functionName: "getPull",
    args: [receipt.requestId]
  });
  const [, batchId, , drawIndex, inventoryId, inventoryIndex, fulfilled] = pull;

  if (
    batchId.toLowerCase() !== receipt.batchId.toLowerCase()
    || drawIndex !== receipt.drawIndex
  ) {
    throw new Error("GIWA pull receipt does not match the reserved draw");
  }
  if (!fulfilled) return undefined;

  const events = await publicClient.getContractEvents({
    address: receipt.contractAddress,
    abi: giwaPackBatchAbi,
    eventName: "PullFulfilled",
    args: { requestId: receipt.requestId },
    fromBlock: receipt.requestBlockNumber,
    toBlock: "latest"
  });
  const event = events.find(
    (candidate) =>
      candidate.args.inventoryId?.toLowerCase() === inventoryId.toLowerCase()
      && candidate.args.inventoryIndex === inventoryIndex
  );

  if (!event?.transactionHash) return undefined;

  return {
    explorerUrl: getGiwaExplorerTransactionUrl(event.transactionHash),
    fulfillmentTransactionHash: event.transactionHash,
    inventoryId,
    inventoryIndex
  };
}

export async function triggerGiwaPullFulfillment(
  receipt: GiwaPullReceipt,
  fetchRequest: KeeperFetch = fetch
) {
  const response = await fetchRequest("/api/giwa/fulfill", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ requestId: receipt.requestId.toString() })
  });

  if (!response.ok) {
    throw new Error(`GIWA Keeper returned ${response.status}`);
  }
}

export async function waitForGiwaPullFulfillment(
  receipt: GiwaPullReceipt,
  {
    delay = wait,
    pollIntervalMs = 750,
    readFulfillment = readGiwaPullFulfillment,
    triggerFulfillment = triggerGiwaPullFulfillment,
    triggerIntervalMs = 15_000,
    timeoutMs = 120_000
  }: WaitForFulfillmentOptions = {}
): Promise<GiwaPullFulfillment | undefined> {
  let elapsedMs = 0;
  let nextTriggerAt = 0;

  while (true) {
    if (elapsedMs >= nextTriggerAt) {
      try {
        await triggerFulfillment(receipt);
      } catch {
        // The canonical contract read below remains the source of truth.
      }
      nextTriggerAt = elapsedMs + triggerIntervalMs;
    }

    const fulfillment = await readFulfillment(receipt);
    if (fulfillment) return fulfillment;
    if (elapsedMs >= timeoutMs) return undefined;

    const waitMs = Math.min(pollIntervalMs, timeoutMs - elapsedMs);
    await delay(waitMs);
    elapsedMs += waitMs;
  }
}

function wait(milliseconds: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds));
}
