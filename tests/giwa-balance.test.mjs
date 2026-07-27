import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createServer } from "vite";

let formatGiwaNativeBalance;
let getGiwaNativeBalance;
let server;

before(async () => {
  server = await createServer({
    appType: "custom",
    server: { hmr: false, middlewareMode: true }
  });

  const balanceModule = await server.ssrLoadModule("/src/giwaBalance.ts");

  ({ formatGiwaNativeBalance, getGiwaNativeBalance } = balanceModule);
});

after(async () => {
  await server?.close();
});

test("formats zero and tiny GIWA balances without implying spendable value", () => {
  assert.equal(typeof formatGiwaNativeBalance, "function");
  assert.equal(formatGiwaNativeBalance(0n), "0 ETH");
  assert.equal(formatGiwaNativeBalance(1n), "<0.0001 ETH");
});

test("formats GIWA balances with four stable decimal places", () => {
  assert.equal(typeof formatGiwaNativeBalance, "function");
  assert.equal(formatGiwaNativeBalance(1_234_560_000_000_000n), "0.0012 ETH");
  assert.equal(formatGiwaNativeBalance(1_234_567_890_000_000_000n), "1.2345 ETH");
});

test("reads the connected address through an injectable GIWA balance reader", async () => {
  assert.equal(typeof getGiwaNativeBalance, "function");

  const address = "0x0000000000000000000000000000000000000001";
  let requestedAddress;
  const balance = await getGiwaNativeBalance(address, {
    async getBalance({ address: nextAddress }) {
      requestedAddress = nextAddress;
      return 42n;
    }
  });

  assert.equal(balance, 42n);
  assert.equal(requestedAddress, address);
});

test("rejects an invalid GIWA balance address before reading the network", async () => {
  assert.equal(typeof getGiwaNativeBalance, "function");

  await assert.rejects(
    getGiwaNativeBalance("not-an-address", {
      async getBalance() {
        throw new Error("reader must not run");
      }
    }),
    /valid EVM address/
  );
});
