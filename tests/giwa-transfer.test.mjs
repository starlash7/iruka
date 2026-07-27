import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createServer } from "vite";

let createGiwaTransfer;
let parseGiwaTransferAmount;
let server;

before(async () => {
  server = await createServer({
    appType: "custom",
    server: { hmr: false, middlewareMode: true }
  });

  ({ createGiwaTransfer, parseGiwaTransferAmount } =
    await server.ssrLoadModule("/src/giwaTransfer.ts"));
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
