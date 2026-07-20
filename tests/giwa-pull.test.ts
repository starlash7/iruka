import assert from "node:assert/strict";
import test from "node:test";
import {
  getGiwaExplorerTransactionUrl,
  getGiwaPackBatchAddress
} from "../src/giwaPull.ts";

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
