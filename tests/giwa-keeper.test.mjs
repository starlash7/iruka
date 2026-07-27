import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  fulfillPullRequest
} from "../server/giwa/fulfillRequest.mjs";
import {
  parseFulfillmentRequest
} from "../api/giwa/fulfill.mjs";

const batchId = `0x${"1".repeat(64)}`;
const inventoryId = `0x${"2".repeat(64)}`;
const manifest = {
  batchId,
  drawSeeds: [{
    drawIndex: 0,
    proof: [`0x${"3".repeat(64)}`],
    seed: `0x${"4".repeat(64)}`
  }],
  inventory: [{
    index: 0,
    inventoryId,
    proof: [`0x${"5".repeat(64)}`]
  }]
};

test("fulfilled requests return their existing result without another transaction", async () => {
  let submitCount = 0;
  const result = await fulfillPullRequest({
    manifest,
    requestId: 1n,
    readBatch: async () => ({ nextFulfillIndex: 1 }),
    readPull: async () => ({
      batchId,
      drawIndex: 0,
      fulfilled: true,
      inventoryId,
      inventoryIndex: 0
    }),
    previewDraw: async () => {
      throw new Error("preview should not run");
    },
    submitFulfillment: async () => {
      submitCount += 1;
      return "0xunused";
    }
  });

  assert.deepEqual(result, {
    status: "fulfilled",
    inventoryId,
    inventoryIndex: 0
  });
  assert.equal(submitCount, 0);
});

test("out-of-order requests remain pending without spending keeper gas", async () => {
  let submitCount = 0;
  const result = await fulfillPullRequest({
    manifest,
    requestId: 2n,
    readBatch: async () => ({ nextFulfillIndex: 0 }),
    readPull: async () => ({
      batchId,
      drawIndex: 1,
      fulfilled: false,
      inventoryId: `0x${"0".repeat(64)}`,
      inventoryIndex: 0
    }),
    previewDraw: async () => {
      throw new Error("preview should not run");
    },
    submitFulfillment: async () => {
      submitCount += 1;
      return "0xunused";
    }
  });

  assert.deepEqual(result, { status: "pending", nextFulfillIndex: 0 });
  assert.equal(submitCount, 0);
});

test("the next request submits its committed seed and inventory proof", async () => {
  let submitted;
  const transactionHash = `0x${"6".repeat(64)}`;
  const result = await fulfillPullRequest({
    manifest,
    requestId: 1n,
    readBatch: async () => ({ nextFulfillIndex: 0 }),
    readPull: async () => ({
      batchId,
      drawIndex: 0,
      fulfilled: false,
      inventoryId: `0x${"0".repeat(64)}`,
      inventoryIndex: 0
    }),
    previewDraw: async (input) => {
      assert.equal(input.serverSeed, manifest.drawSeeds[0].seed);
      return { inventoryIndex: 0 };
    },
    submitFulfillment: async (input) => {
      submitted = input;
      return transactionHash;
    }
  });

  assert.equal(submitted.inventoryId, inventoryId);
  assert.deepEqual(submitted.inventoryProof, manifest.inventory[0].proof);
  assert.deepEqual(submitted.seedProof, manifest.drawSeeds[0].proof);
  assert.deepEqual(result, {
    status: "submitted",
    transactionHash,
    inventoryId,
    inventoryIndex: 0
  });
});

test("a concurrent fulfillment race returns the newly confirmed result", async () => {
  let readCount = 0;
  const result = await fulfillPullRequest({
    manifest,
    requestId: 1n,
    readBatch: async () => ({ nextFulfillIndex: 0 }),
    readPull: async () => {
      readCount += 1;
      return {
        batchId,
        drawIndex: 0,
        fulfilled: readCount > 1,
        inventoryId,
        inventoryIndex: 0
      };
    },
    previewDraw: async () => ({ inventoryIndex: 0 }),
    submitFulfillment: async () => {
      throw new Error("already fulfilled");
    }
  });

  assert.deepEqual(result, {
    status: "fulfilled",
    inventoryId,
    inventoryIndex: 0
  });
});

test("the API accepts only positive integer request IDs", () => {
  assert.equal(parseFulfillmentRequest({ requestId: "12" }), 12n);
  assert.throws(() => parseFulfillmentRequest({ requestId: "0" }), /request id/i);
  assert.throws(() => parseFulfillmentRequest({ requestId: "1.5" }), /request id/i);
  assert.throws(() => parseFulfillmentRequest({}), /request id/i);
});

test("keeper recovery uses a dedicated key instead of the deployer key", async () => {
  const source = await readFile(
    new URL("../scripts/giwa/fulfill-pull.mjs", import.meta.url),
    "utf8"
  );

  assert.match(source, /GIWA_KEEPER_PRIVATE_KEY/);
  assert.doesNotMatch(source, /GIWA_DEPLOYER_PRIVATE_KEY/);
});

test("the Keeper returns after broadcasting instead of waiting for a receipt", async () => {
  const source = await readFile(
    new URL("../server/giwa/fulfillRequest.mjs", import.meta.url),
    "utf8"
  );

  assert.doesNotMatch(source, /waitForTransactionReceipt/);
});
