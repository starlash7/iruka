import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createServer } from "vite";

let server;
let getAuthenticatedGiwaWallet;

before(async () => {
  server = await createServer({ appType: "custom", server: { middlewareMode: true } });
  ({ getAuthenticatedGiwaWallet } = await server.ssrLoadModule("/src/AuthActions.tsx"));
});

after(async () => {
  await server?.close();
});

test("keeps the authenticated session while Privy wallets are still loading", () => {
  assert.equal(
    getAuthenticatedGiwaWallet(true, false, []),
    undefined
  );
});

test("uses only a linked EVM wallet for GIWA transactions", () => {
  const solanaWallet = { linked: true, type: "solana" };
  const unlinkedEvmWallet = { linked: false, type: "ethereum" };
  const linkedEvmWallet = { linked: true, type: "ethereum" };

  assert.equal(
    getAuthenticatedGiwaWallet(true, true, [solanaWallet, unlinkedEvmWallet, linkedEvmWallet]),
    linkedEvmWallet
  );
});
