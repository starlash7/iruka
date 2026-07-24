import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { after, before, test } from "node:test";
import { createServer } from "vite";

let server;
let getAuthenticatedGiwaWallet;
let getTransactionGiwaWallet;
let shouldHandleWalletPrompt;

before(async () => {
  server = await createServer({ appType: "custom", server: { middlewareMode: true } });
  ({
    getAuthenticatedGiwaWallet,
    getTransactionGiwaWallet,
    shouldHandleWalletPrompt
  } = await server.ssrLoadModule("/src/walletConnection.ts"));
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

test("requires the current browser session before using an external wallet", () => {
  const externalWallet = {
    address: "0xexternal",
    linked: true,
    type: "ethereum",
    walletClientType: "metamask"
  };

  assert.equal(
    getTransactionGiwaWallet(true, true, [externalWallet]),
    undefined
  );
  assert.equal(
    getTransactionGiwaWallet(true, true, [externalWallet], "0xexternal"),
    externalWallet
  );
});

test("keeps the embedded wallet available for a signed-in email or Google user", () => {
  const embeddedWallet = {
    address: "0xembedded",
    linked: true,
    type: "ethereum",
    walletClientType: "privy"
  };

  assert.equal(
    getTransactionGiwaWallet(true, true, [embeddedWallet]),
    embeddedWallet
  );
});

test("handles each wallet prompt signal only once", () => {
  assert.equal(shouldHandleWalletPrompt(1, 0, true), true);
  assert.equal(shouldHandleWalletPrompt(1, 1, true), false);
  assert.equal(shouldHandleWalletPrompt(2, 1, true), true);
  assert.equal(shouldHandleWalletPrompt(2, 1, false), false);
});

test("primary authentication buttons use the subtle action beam", async () => {
  const source = await readFile(new URL("../src/AuthActions.tsx", import.meta.url), "utf8");

  assert.match(source, /<IrukaBeam className="auth-primary-beam" variant="action">/);
});
