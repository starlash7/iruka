import { createPublicClient, http, type Hex } from "viem";
import { activeChain as giwaSepolia, activeDeployment } from "./activeDeployment.ts";
import { giwaPackBatchAbi } from "./giwaPackBatch.ts";
import {
  getGiwaExplorerTransactionUrl,
  type GiwaPullReceipt
} from "./giwaPull.ts";

export type GiwaPullFulfillment = {
  fulfillmentBlockNumber?: bigint;
  explorerUrl: string;
  fulfillmentTransactionHash: Hex;
  inventoryId: Hex;
  inventoryIndex: number;
};

type WaitForFulfillmentOptions = {
  delay?: (milliseconds: number) => Promise<void>;
  now?: () => number;
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
  const [collector, batchId, , drawIndex, inventoryId, inventoryIndex, fulfilled] = pull;

  if (
    (receipt.collector && collector.toLowerCase() !== receipt.collector.toLowerCase())
    || batchId.toLowerCase() !== receipt.batchId.toLowerCase()
    || drawIndex !== receipt.drawIndex
  ) {
    throw new Error("GIWA pull receipt does not match the reserved draw");
  }
  if (!fulfilled) return undefined;

  const latestBlock = activeDeployment.id === "monad"
    ? await publicClient.getBlockNumber({ cacheTime: 0 }) : undefined;
  for (let fromBlock = receipt.requestBlockNumber;
    latestBlock === undefined || fromBlock <= latestBlock;
    fromBlock += 100n) {
    // Monad's public RPC accepts at most 100 blocks, including both endpoints.
    const toBlock = latestBlock === undefined ? "latest"
      : fromBlock + 99n < latestBlock ? fromBlock + 99n : latestBlock;
    const events = await publicClient.getContractEvents({
      address: receipt.contractAddress,
      abi: giwaPackBatchAbi,
      eventName: "PullFulfilled",
      args: { requestId: receipt.requestId },
      fromBlock,
      toBlock
    });
    const event = events.find(
      (candidate) =>
        candidate.args.batchId?.toLowerCase() === receipt.batchId.toLowerCase()
        && candidate.args.collector?.toLowerCase() === collector.toLowerCase()
        && candidate.args.inventoryId?.toLowerCase() === inventoryId.toLowerCase()
        && candidate.args.inventoryIndex === inventoryIndex
    );
    if (event?.transactionHash) {
      return {
        fulfillmentBlockNumber: event.blockNumber ?? undefined,
        explorerUrl: getGiwaExplorerTransactionUrl(event.transactionHash),
        fulfillmentTransactionHash: event.transactionHash,
        inventoryId,
        inventoryIndex
      };
    }
    if (latestBlock === undefined) break;
  }
  return undefined;
}

export async function triggerGiwaPullFulfillment(
  receipt: GiwaPullReceipt,
  fetchRequest: KeeperFetch = fetch
) {
  if (receipt.requestId <= 0n) throw new TypeError("A positive request ID is required");
  const response = await fetchRequest(activeDeployment.fulfillmentPath, {
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
    now = Date.now,
    pollIntervalMs = 750,
    readFulfillment = readGiwaPullFulfillment,
    triggerFulfillment = triggerGiwaPullFulfillment,
    triggerIntervalMs = 15_000,
    timeoutMs = 120_000
  }: WaitForFulfillmentOptions = {}
): Promise<GiwaPullFulfillment | undefined> {
  const startedAt = now();
  let elapsedMs = 0;
  let nextTriggerAt = 0;
  let nextPollIntervalMs = pollIntervalMs;
  let triggerInFlight: Promise<void> | undefined;

  while (true) {
    if (elapsedMs >= nextTriggerAt && !triggerInFlight) {
      triggerInFlight = triggerFulfillment(receipt)
        .catch(() => {
          // The canonical contract read below remains the source of truth.
        })
        .finally(() => {
          triggerInFlight = undefined;
        });
      nextTriggerAt = elapsedMs + triggerIntervalMs;
    }

    const fulfillment = await readFulfillment(receipt);
    if (fulfillment) return fulfillment;
    const wallClockElapsedMs = Math.max(0, now() - startedAt);
    if (elapsedMs >= timeoutMs || wallClockElapsedMs >= timeoutMs) {
      return undefined;
    }

    const waitMs = Math.min(
      nextPollIntervalMs,
      timeoutMs - elapsedMs,
      timeoutMs - wallClockElapsedMs
    );
    await delay(waitMs);
    elapsedMs += waitMs;
    nextPollIntervalMs = Math.min(
      Math.ceil(nextPollIntervalMs * 1.5),
      5_000
    );
  }
}

function wait(milliseconds: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds));
}
