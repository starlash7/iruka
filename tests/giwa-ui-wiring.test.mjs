import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const [
  appSource,
  authSource,
  privyAuthSource,
  walletSource,
  giwaPullSource,
  giwaFulfillmentSource
] = await Promise.all([
  readFile(new URL("../src/App.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/AuthActions.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/PrivyAuthActions.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/walletConnection.ts", import.meta.url), "utf8"),
  readFile(new URL("../src/giwaPull.ts", import.meta.url), "utf8"),
  readFile(new URL("../src/giwaFulfillment.ts", import.meta.url), "utf8")
]);

test("the Vending action uses the GIWA transaction path when a contract is configured", () => {
  assert.match(appSource, /requestGiwaPull\(/);
  assert.match(appSource, /getGiwaPackBatchAddress\(\)/);
  assert.match(appSource, /setOnchainPull/);
});

test("a reserved GIWA pull waits for its committed inventory before Reveal", () => {
  assert.match(appSource, /waitForGiwaPullFulfillment\(/);
  assert.match(appSource, /createGiwaVendingPull\(/);
  assert.match(appSource, /onchainPull\.fulfillment/);
  assert.match(appSource, /setPendingReveal\(/);
});

test("a pending GIWA pull rechecks its existing receipt instead of requesting again", () => {
  assert.match(appSource, /existingOnchainPull/);
  assert.match(appSource, /existingOnchainPull\s*\?\?\s*await requestGiwaPull/);
  assert.match(appSource, /giwaPullPending/);
});

test("a submitted pull does not interrupt opening with a technical confirmation notice", () => {
  assert.doesNotMatch(appSource, /showNotice\(t\.feedback\.giwaPullConfirmed\)/);
});

test("Privy passes an EVM wallet to the GIWA pull flow", () => {
  assert.match(authSource, /onWalletChange/);
  assert.match(privyAuthSource, /getIrukaAccountWallet/);
  assert.match(walletSource, /wallet\.walletClientType\?\.startsWith\("privy"\)/);
});

test("GIWA pull asks the wallet for one request transaction", () => {
  assert.match(giwaPullSource, /args:\s*\[batchId,\s*clientSeed\]/);
  assert.doesNotMatch(giwaPullSource, /revealClientSeed/);
  assert.doesNotMatch(giwaPullSource, /revealTransactionHash/);
});

test("the confirmed request automatically triggers the same-origin Keeper", () => {
  assert.match(giwaFulfillmentSource, /\/api\/giwa\/fulfill/);
  assert.match(giwaFulfillmentSource, /requestId:\s*receipt\.requestId\.toString\(\)/);
  assert.doesNotMatch(giwaFulfillmentSource, /eth_sendTransaction/);
});

test("GIWA clients use short testnet polling intervals", () => {
  assert.match(giwaPullSource, /pollingInterval:\s*500/);
  assert.match(giwaFulfillmentSource, /pollingInterval:\s*500/);
});
