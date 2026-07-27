import assert from "node:assert/strict";
import test from "node:test";
import {
  getGiwaExplorerTransactionUrl,
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

test("links GIWA pull receipts to the explorer transaction", () => {
  assert.equal(
    getGiwaExplorerTransactionUrl("0x1234"),
    "https://sepolia-explorer.giwa.io/tx/0x1234"
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
