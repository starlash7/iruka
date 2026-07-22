import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const [appSource, authSource, walletSource] = await Promise.all([
  readFile(new URL("../src/App.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/AuthActions.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/walletConnection.ts", import.meta.url), "utf8")
]);

test("the Vending action uses the GIWA transaction path when a contract is configured", () => {
  assert.match(appSource, /requestGiwaPull\(/);
  assert.match(appSource, /getGiwaPackBatchAddress\(\)/);
  assert.match(appSource, /setOnchainPull/);
});

test("Privy passes an EVM wallet to the GIWA pull flow", () => {
  assert.match(authSource, /onWalletChange/);
  assert.match(authSource, /getTransactionGiwaWallet/);
  assert.match(walletSource, /wallet\.type === "ethereum" && wallet\.linked/);
});
