import assert from "node:assert/strict";
import test from "node:test";
import {
  createClientSeed,
  getBatchCommitmentId,
  getInventoryCommitmentId,
  isContractAddress
} from "../src/giwaPackBatch.ts";

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
