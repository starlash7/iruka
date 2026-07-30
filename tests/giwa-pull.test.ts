import assert from "node:assert/strict";
import test from "node:test";
import {
  getGiwaExplorerTransactionUrl,
  getGiwaPackBatchSnapshot,
  getGiwaPackBatchState,
  getGiwaPackBatchAddress,
  type GiwaPullReceipt
} from "../src/giwaPull.ts";
import {
  triggerGiwaPullFulfillment,
  waitForGiwaPullFulfillment,
  type GiwaPullFulfillment
} from "../src/giwaFulfillment.ts";

const receipt: GiwaPullReceipt = {
  batchId: `0x${"1".repeat(64)}`,
  contractAddress: "0x000000000000000000000000000000000000dEaD",
  drawIndex: 0,
  explorerUrl: "https://sepolia-explorer.giwa.io/tx/0x1234",
  requestBlockNumber: 10n,
  requestId: 1n,
  requestTransactionHash: "0x1234"
};

const fulfillment: GiwaPullFulfillment = {
  explorerUrl: "https://sepolia-explorer.giwa.io/tx/0xabcd",
  fulfillmentTransactionHash: "0xabcd",
  inventoryId: `0x${"2".repeat(64)}`,
  inventoryIndex: 0
};

test("reads only a valid configured GIWA batch contract", () => {
  assert.equal(getGiwaPackBatchAddress("not-an-address"), undefined);
  assert.equal(
    getGiwaPackBatchAddress("0x000000000000000000000000000000000000dEaD"),
    "0x000000000000000000000000000000000000dEaD"
  );
});

test("local development keeps Privy but bypasses GIWA pulls", () => {
  const address = "0x000000000000000000000000000000000000dEaD";

  assert.equal(getGiwaPackBatchAddress(address, true), undefined);
  assert.equal(getGiwaPackBatchAddress(address, false), address);
});

test("links GIWA pull receipts to the explorer transaction", () => {
  assert.equal(
    getGiwaExplorerTransactionUrl("0x1234"),
    "https://sepolia-explorer.giwa.io/tx/0x1234"
  );
});

test("enables GIWA pulls only for committed batches with inventory", async () => {
  assert.equal(
    await getGiwaPackBatchState(
      { batchId: "IRK-GG-2026-001" },
      async () => [100, 98]
    ),
    "live"
  );
  assert.equal(
    await getGiwaPackBatchState(
      { batchId: "IRK-GG-2026-001" },
      async () => [100, 0]
    ),
    "sold-out"
  );
  assert.equal(
    await getGiwaPackBatchState(
      { batchId: "IRK-GG-2026-002" },
      async () => {
        throw new Error("BatchNotFound");
      }
    ),
    "unavailable"
  );
});

test("reads the live GIWA price from the committed batch", async () => {
  assert.deepEqual(
    await getGiwaPackBatchSnapshot(
      { batchId: "IRK-GG-2026-001" },
      async () => [100, 98, 98, 10_000_000_000_000n]
    ),
    {
      priceWei: 10_000_000_000_000n,
      state: "live"
    }
  );
});

test("polls the same request until fulfillment is available", async () => {
  let readCount = 0;
  let triggerCount = 0;
  const result = await waitForGiwaPullFulfillment(receipt, {
    delay: async () => {},
    pollIntervalMs: 10,
    readFulfillment: async () => {
      readCount += 1;
      return readCount === 3 ? fulfillment : undefined;
    },
    triggerFulfillment: async () => {
      triggerCount += 1;
    },
    triggerIntervalMs: 20,
    timeoutMs: 100
  });

  assert.deepEqual(result, fulfillment);
  assert.equal(readCount, 3);
  assert.equal(triggerCount, 2);
});

test("returns pending after the fulfillment polling timeout", async () => {
  let readCount = 0;
  const result = await waitForGiwaPullFulfillment(receipt, {
    delay: async () => {},
    pollIntervalMs: 10,
    readFulfillment: async () => {
      readCount += 1;
      return undefined;
    },
    triggerFulfillment: async () => {},
    timeoutMs: 20
  });

  assert.equal(result, undefined);
  assert.equal(readCount, 3);
});

test("checks the result quickly after the Keeper submission", async () => {
  const delays: number[] = [];
  let readCount = 0;

  const result = await waitForGiwaPullFulfillment(receipt, {
    delay: async (milliseconds) => {
      delays.push(milliseconds);
    },
    readFulfillment: async () => {
      readCount += 1;
      return readCount === 2 ? fulfillment : undefined;
    },
    triggerFulfillment: async () => {}
  });

  assert.deepEqual(result, fulfillment);
  assert.deepEqual(delays, [750]);
});

test("polls the chain without waiting for the Keeper HTTP response", async () => {
  let triggerFinished = false;

  const result = await waitForGiwaPullFulfillment(receipt, {
    readFulfillment: async () => {
      assert.equal(triggerFinished, false);
      return fulfillment;
    },
    triggerFulfillment: async () => {
      await new Promise<void>((resolve) => setImmediate(resolve));
      triggerFinished = true;
    }
  });

  assert.deepEqual(result, fulfillment);
});

test("backs off repeated fulfillment reads", async () => {
  const delays: number[] = [];
  let readCount = 0;

  const result = await waitForGiwaPullFulfillment(receipt, {
    delay: async (milliseconds) => {
      delays.push(milliseconds);
    },
    pollIntervalMs: 10,
    readFulfillment: async () => {
      readCount += 1;
      return readCount === 3 ? fulfillment : undefined;
    },
    triggerFulfillment: async () => {},
    triggerIntervalMs: 100,
    timeoutMs: 100
  });

  assert.deepEqual(result, fulfillment);
  assert.deepEqual(delays, [10, 15]);
});

test("uses a wall-clock deadline when network work consumes the timeout", async () => {
  let currentTime = 0;
  let readCount = 0;

  const result = await waitForGiwaPullFulfillment(receipt, {
    delay: async () => {},
    now: () => currentTime,
    readFulfillment: async () => {
      readCount += 1;
      currentTime = 101;
      return undefined;
    },
    triggerFulfillment: async () => {},
    timeoutMs: 100
  });

  assert.equal(result, undefined);
  assert.equal(readCount, 1);
});

test("asks the same-origin keeper to fulfill the existing request", async () => {
  let requestedUrl = "";
  let requestedBody = "";

  await triggerGiwaPullFulfillment(receipt, async (url, init) => {
    requestedUrl = String(url);
    requestedBody = String(init?.body);
    return { ok: true, status: 202 } as Response;
  });

  assert.equal(requestedUrl, "/api/giwa/fulfill");
  assert.deepEqual(JSON.parse(requestedBody), { requestId: "1" });
});
