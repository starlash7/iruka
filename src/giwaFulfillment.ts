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
  signal?: AbortSignal;
  delay?: (milliseconds: number) => Promise<void>;
  now?: () => number;
  pollIntervalMs?: number;
  readFulfillment?: (
    receipt: GiwaPullReceipt,
    signal?: AbortSignal
  ) => Promise<GiwaPullFulfillment | undefined>;
  triggerFulfillment?: (receipt: GiwaPullReceipt, signal?: AbortSignal) => Promise<void>;
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

const scanProgress = new Map<string, { signature: string; nextBlock: bigint; head: bigint }>();

export async function readGiwaPullFulfillment(
  receipt: GiwaPullReceipt,
  signal?: AbortSignal
): Promise<GiwaPullFulfillment | undefined> {
  signal?.throwIfAborted();
  const client = signal ? createPublicClient({
    chain: giwaSepolia,
    pollingInterval: 500,
    transport: http(giwaSepolia.rpcUrls.default.http[0], { fetchOptions: { signal } })
  }) : publicClient;
  const scanKey = [giwaSepolia.id, receipt.contractAddress.toLowerCase(), receipt.requestId,
    receipt.requestTransactionHash.toLowerCase(), receipt.requestBlockNumber].join(":");
  const pull = await client.readContract({
    address: receipt.contractAddress,
    abi: giwaPackBatchAbi,
    functionName: "getPull",
    args: [receipt.requestId]
  });
  signal?.throwIfAborted();
  const [collector, batchId, seed, drawIndex, inventoryId, inventoryIndex, fulfilled] = pull;

  if (
    (receipt.collector && collector.toLowerCase() !== receipt.collector.toLowerCase())
    || batchId.toLowerCase() !== receipt.batchId.toLowerCase()
    || drawIndex !== receipt.drawIndex
  ) {
    scanProgress.delete(scanKey);
    throw new Error("GIWA pull receipt does not match the reserved draw");
  }
  if (!fulfilled) {
    scanProgress.delete(scanKey);
    return undefined;
  }

  const latestBlock = activeDeployment.id === "monad"
    ? await client.getBlockNumber({ cacheTime: 0 }) : undefined;
  signal?.throwIfAborted();
  const signature = [collector, batchId, seed, drawIndex, inventoryId, inventoryIndex].join(":").toLowerCase();
  let progress = latestBlock === undefined ? undefined : scanProgress.get(scanKey);
  if (latestBlock !== undefined && (!progress || progress.signature !== signature || latestBlock < progress.head)) {
    progress = { signature, nextBlock: receipt.requestBlockNumber, head: latestBlock };
    scanProgress.delete(scanKey);
    // A browser only needs a small number of interrupted requests in memory.
    if (scanProgress.size >= 32) scanProgress.delete(scanProgress.keys().next().value!);
    scanProgress.set(scanKey, progress);
  }
  if (progress && latestBlock !== undefined) progress.head = latestBlock;
  for (let fromBlock = progress?.nextBlock ?? receipt.requestBlockNumber;
    latestBlock === undefined || fromBlock <= latestBlock;
    fromBlock += 100n) {
    // Monad's public RPC accepts at most 100 blocks, including both endpoints.
    const toBlock = latestBlock === undefined ? "latest"
      : fromBlock + 99n < latestBlock ? fromBlock + 99n : latestBlock;
    const events = await client.getContractEvents({
      address: receipt.contractAddress,
      abi: giwaPackBatchAbi,
      eventName: "PullFulfilled",
      args: { requestId: receipt.requestId },
      fromBlock,
      toBlock
    });
    signal?.throwIfAborted();
    const event = events.find(
      (candidate) =>
        candidate.args.batchId?.toLowerCase() === receipt.batchId.toLowerCase()
        && candidate.args.collector?.toLowerCase() === collector.toLowerCase()
        && candidate.args.inventoryId?.toLowerCase() === inventoryId.toLowerCase()
        && candidate.args.inventoryIndex === inventoryIndex
    );
    if (event?.transactionHash) {
      scanProgress.delete(scanKey);
      return {
        fulfillmentBlockNumber: event.blockNumber ?? undefined,
        explorerUrl: getGiwaExplorerTransactionUrl(event.transactionHash),
        fulfillmentTransactionHash: event.transactionHash,
        inventoryId,
        inventoryIndex
      };
    }
    if (latestBlock === undefined) break;
    if (progress && scanProgress.get(scanKey) === progress && typeof toBlock === "bigint") {
      progress.nextBlock = toBlock + 1n;
    }
  }
  // A complete scan without an event can reflect delayed indexing; retry it in full.
  scanProgress.delete(scanKey);
  return undefined;
}

export async function triggerGiwaPullFulfillment(
  receipt: GiwaPullReceipt,
  fetchRequest: KeeperFetch = fetch,
  signal?: AbortSignal
) {
  if (receipt.requestId <= 0n) throw new TypeError("A positive request ID is required");
  const response = await fetchRequest(activeDeployment.fulfillmentPath, {
    signal,
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
    signal,
    delay = wait,
    now = Date.now,
    pollIntervalMs = 750,
    readFulfillment = readGiwaPullFulfillment,
    triggerFulfillment = (receipt, signal) => triggerGiwaPullFulfillment(receipt, fetch, signal),
    triggerIntervalMs = 15_000,
    timeoutMs = 120_000
  }: WaitForFulfillmentOptions = {}
): Promise<GiwaPullFulfillment | undefined> {
  if (signal?.aborted || timeoutMs <= 0) return undefined;
  const controller = new AbortController();
  let timeout: ReturnType<typeof setTimeout> | undefined;
  let cancel!: () => void;
  const deadline = new Promise<undefined>((resolve) => {
    cancel = () => { resolve(undefined); controller.abort(); };
    timeout = setTimeout(cancel, timeoutMs);
    signal?.addEventListener("abort", cancel, { once: true });
  });
  try {
    return await Promise.race([poll(), deadline]);
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", cancel);
    controller.abort();
  }

  async function poll() {
    const startedAt = now();
    let elapsedMs = 0;
    let nextTriggerAt = 0;
    let nextPollIntervalMs = pollIntervalMs;
    let triggerInFlight: Promise<void> | undefined;

    while (true) {
      if (elapsedMs >= nextTriggerAt && !triggerInFlight) {
        triggerInFlight = triggerFulfillment(receipt, controller.signal)
          .catch(() => {
            // The canonical contract read below remains the source of truth.
          })
          .finally(() => {
            triggerInFlight = undefined;
          });
        nextTriggerAt = elapsedMs + triggerIntervalMs;
      }

      const fulfillment = await readFulfillment(receipt, controller.signal);
      const wallClockElapsedMs = Math.max(0, now() - startedAt);
      if (controller.signal.aborted || elapsedMs >= timeoutMs || wallClockElapsedMs >= timeoutMs) {
        return undefined;
      }
      if (fulfillment) return fulfillment;

      const waitMs = Math.min(
        nextPollIntervalMs,
        timeoutMs - elapsedMs,
        timeoutMs - wallClockElapsedMs
      );
      await (delay === wait ? wait(waitMs, controller.signal) : delay(waitMs));
      if (controller.signal.aborted) return undefined;
      elapsedMs += waitMs;
      nextPollIntervalMs = Math.min(
        Math.ceil(nextPollIntervalMs * 1.5),
        5_000
      );
    }
  }
}

function wait(milliseconds: number, signal?: AbortSignal) {
  return new Promise<void>((resolve) => {
    const finish = () => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", finish);
      resolve();
    };
    const timer = setTimeout(finish, milliseconds);
    signal?.addEventListener("abort", finish, { once: true });
    if (signal?.aborted) finish();
  });
}
