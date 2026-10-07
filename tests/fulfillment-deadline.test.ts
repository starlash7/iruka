import assert from "node:assert/strict";
import { test } from "node:test";
import { waitForGiwaPullFulfillment } from "../src/giwaFulfillment.ts";
import type { GiwaPullReceipt } from "../src/giwaPull.ts";

const receipt: GiwaPullReceipt = {
  batchId: `0x${"11".repeat(32)}`, contractAddress: "0x0000000000000000000000000000000000000001",
  requestId: 1n, drawIndex: 0, requestBlockNumber: 1n,
  requestTransactionHash: `0x${"22".repeat(32)}`, explorerUrl: ""
};

async function withinDeadline(operation: Promise<unknown>) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([operation, new Promise(resolve => { timer = setTimeout(() => resolve("deadline missed"), 200); })]);
  } finally { clearTimeout(timer); }
}

test("returns pending at its deadline even when the fulfillment reader never settles", async () => {
  let signal: AbortSignal | undefined;
  const result = await withinDeadline(waitForGiwaPullFulfillment(receipt, {
    timeoutMs: 25,
    readFulfillment: async (_receipt, readSignal) => { signal = readSignal; return new Promise(() => {}); },
    triggerFulfillment: async () => {}
  }));
  assert.equal(result, undefined);
  assert.equal(signal?.aborted, true);
});

test("caller cancellation ends a stuck read and aborts its work", async () => {
  const controller = new AbortController();
  let readSignal: AbortSignal | undefined;
  const operation = waitForGiwaPullFulfillment(receipt, {
    signal: controller.signal, timeoutMs: 1000,
    readFulfillment: async (_receipt, signal) => { readSignal = signal; return new Promise(() => {}); },
    triggerFulfillment: async () => {}
  });
  controller.abort();
  assert.equal(await withinDeadline(operation), undefined);
  assert.equal(readSignal?.aborted, true);
});

test("a reader rejecting after timeout does not create an unhandled rejection", async () => {
  let rejectRead!: (error: Error) => void;
  const result = await withinDeadline(waitForGiwaPullFulfillment(receipt, {
    timeoutMs: 25,
    readFulfillment: () => new Promise((_resolve, reject) => { rejectRead = reject; }),
    triggerFulfillment: async () => {}
  }));
  assert.equal(result, undefined);
  rejectRead(new Error("late RPC failure"));
  await new Promise(resolve => setImmediate(resolve));
});

test("does not return fulfillment that arrives after the supplied wall-clock deadline", async () => {
  let now = 0;
  const result = await waitForGiwaPullFulfillment(receipt, {
    now: () => now, timeoutMs: 10,
    readFulfillment: async () => {
      now = 11;
      return { explorerUrl: "", fulfillmentTransactionHash: `0x${"33".repeat(32)}`, inventoryId: `0x${"44".repeat(32)}`, inventoryIndex: 0 };
    },
    triggerFulfillment: async () => {}
  });
  assert.equal(result, undefined);
});
