import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createServer } from "vite";

let getGiwaTransferInputState;
let createGiwaTransfer;
let getSuccessfulGiwaTransferHash;
let parseGiwaTransferAmount;
let server;

before(async () => {
  server = await createServer({
    appType: "custom",
    cacheDir: ".context/restored-giwa-transfer.test",
    optimizeDeps: { noDiscovery: true },
    server: { hmr: false, middlewareMode: true }
  });

  ({ getGiwaTransferInputState, createGiwaTransfer, getSuccessfulGiwaTransferHash, parseGiwaTransferAmount } =
    await server.ssrLoadModule("/src/features/discover/account/giwaTransfer.ts"));
});

after(async () => {
  await server?.close();
});

test("parses positive GIWA ETH amounts without floating point math", () => {
  assert.equal(parseGiwaTransferAmount("0.001"), 1_000_000_000_000_000n);
  assert.equal(parseGiwaTransferAmount(" 1.25 "), 1_250_000_000_000_000_000n);
});

test("rejects empty, zero, negative, and malformed transfer amounts", () => {
  for (const amount of ["", "0", "-1", "not-a-number"]) {
    assert.throws(() => parseGiwaTransferAmount(amount), /valid amount/i);
  }
});

test("builds a same-chain transfer from the selected wallet", () => {
  assert.deepEqual(
    createGiwaTransfer(
      "0x0000000000000000000000000000000000000001",
      "0x0000000000000000000000000000000000000002",
      "0.001"
    ),
    {
      from: "0x0000000000000000000000000000000000000001",
      to: "0x0000000000000000000000000000000000000002",
      value: "0x38d7ea4c68000"
    }
  );
});

test("rejects invalid or identical transfer addresses", () => {
  assert.throws(
    () => createGiwaTransfer(
      "invalid",
      "0x0000000000000000000000000000000000000002",
      "0.001"
    ),
    /valid address/i
  );
  assert.throws(
    () => createGiwaTransfer(
      "0x0000000000000000000000000000000000000001",
      "0x0000000000000000000000000000000000000001",
      "0.001"
    ),
    /different address/i
  );
});

test("rejects the zero address as a transfer destination", () => {
  assert.throws(
    () => createGiwaTransfer(
      "0x0000000000000000000000000000000000000001",
      "0x0000000000000000000000000000000000000000",
      "0.001"
    ),
    /valid address/i
  );
});

test("accepts only successful transfer receipts and returns the mined hash", () => {
  const minedHash = `0x${"33".repeat(32)}`;

  assert.equal(
    getSuccessfulGiwaTransferHash({
      status: "success",
      transactionHash: minedHash
    }),
    minedHash
  );
  assert.throws(
    () => getSuccessfulGiwaTransferHash({
      status: "reverted",
      transactionHash: minedHash
    }),
    /reverted/i
  );
});

test("rejects excess decimal precision instead of silently rounding a transfer", () => {
  assert.throws(() => parseGiwaTransferAmount("1.0000000000000000009"), /valid amount/i);
  assert.equal(parseGiwaTransferAmount(".001"), 1_000_000_000_000_000n);
});


test("withdraw input validation blocks invalid recipients and nonpositive amounts", () => {
  const address = "0x0000000000000000000000000000000000000002";
  for (const destination of ["", "not-an-address", "0x0000000000000000000000000000000000000000"]) {
    assert.equal(getGiwaTransferInputState(destination, "0.001"), "recipient");
  }
  for (const amount of ["", "0", "-1", "NaN", "1.0000000000000000009"]) {
    assert.equal(getGiwaTransferInputState(address, amount), "amount");
  }
  assert.equal(getGiwaTransferInputState(address, "0.001"), "ready");
});

test("cancelled or changed replacement receipts never complete the intended transfer", () => {
  const receipt = {status: "success", transactionHash: `0x${"44".repeat(32)}`};
  for (const reason of ["cancelled", "replaced"]) assert.throws(() => getSuccessfulGiwaTransferHash(receipt, reason), /reverted/i);
  assert.equal(getSuccessfulGiwaTransferHash(receipt, "repriced"), receipt.transactionHash);
});
