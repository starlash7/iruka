import assert from "node:assert/strict";
import test from "node:test";
import {
  createClientSeed,
  getBatchCommitmentId,
  getInventoryCommitmentId,
  giwaPackBatchAbi,
  isContractAddress
} from "../src/giwaPackBatch.ts";
import { createGiwaVendingPull } from "../src/giwaInventory.ts";
import type { GiwaPullFulfillment } from "../src/giwaFulfillment.ts";

test("batch commitments are stable bytes32 hashes", () => {
  assert.equal(
    getBatchCommitmentId("IRK-GG-2026-001"),
    "0xb5b747f00015bd2e58f10ce031df619eaf6571aa4638dfac02a810c69d065b05"
  );
});

test("inventory commitments use the source inventory identifier", () => {
  assert.equal(
    getInventoryCommitmentId("debut-inventory-001"),
    getInventoryCommitmentId("debut-inventory-001")
  );
  assert.notEqual(
    getInventoryCommitmentId("debut-inventory-001"),
    getInventoryCommitmentId("debut-inventory-002")
  );
});

test("client seeds are nonzero 32-byte values", () => {
  const seed = createClientSeed();

  assert.match(seed, /^0x[0-9a-f]{64}$/);
  assert.notEqual(seed, `0x${"0".repeat(64)}`);
});

test("only a complete EVM contract address enables the GIWA pull path", () => {
  assert.equal(isContractAddress("0x123"), false);
  assert.equal(isContractAddress(""), false);
  assert.equal(isContractAddress("0x000000000000000000000000000000000000dEaD"), true);
});

test("GIWA pull ABI uses one client-seed request and records its draw index", () => {
  const requestPull = giwaPackBatchAbi.find(
    (entry) => entry.type === "function" && entry.name === "requestPull"
  );
  const pullRequested = giwaPackBatchAbi.find(
    (entry) => entry.type === "event" && entry.name === "PullRequested"
  );

  assert.equal(requestPull?.inputs[1]?.name, "clientSeed");
  assert.equal(pullRequested?.inputs[3]?.name, "drawIndex");
});

test("GIWA pull ABI exposes the canonical fulfillment event", () => {
  const pullFulfilled = giwaPackBatchAbi.find(
    (entry) => entry.type === "event" && entry.name === "PullFulfilled"
  );

  assert.equal(pullFulfilled?.inputs[0]?.name, "requestId");
  assert.equal(pullFulfilled?.inputs[3]?.name, "inventoryId");
  assert.equal(pullFulfilled?.inputs[4]?.name, "inventoryIndex");
});

test("maps a fulfilled inventory commitment to the exact Vending card", async () => {
  const inventoryId = getInventoryCommitmentId("debut-inventory-001");
  const fulfillment: GiwaPullFulfillment = {
    explorerUrl: "https://sepolia-explorer.giwa.io/tx/0xabcd",
    fulfillmentTransactionHash: "0xabcd",
    inventoryId,
    inventoryIndex: 0
  };

  const pull = await createGiwaVendingPull("debut", fulfillment);

  assert.equal(pull.card.id, "debut-inventory-001");
  assert.equal(pull.card.packId, "debut");
});

test("rejects an onchain inventory commitment that does not match its index", async () => {
  const fulfillment: GiwaPullFulfillment = {
    explorerUrl: "https://sepolia-explorer.giwa.io/tx/0xabcd",
    fulfillmentTransactionHash: "0xabcd",
    inventoryId: getInventoryCommitmentId("debut-inventory-002"),
    inventoryIndex: 0
  };

  await assert.rejects(
    createGiwaVendingPull("debut", fulfillment),
    /inventory commitment does not match/i
  );
});
