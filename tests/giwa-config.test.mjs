import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../src/app-main.tsx", import.meta.url), "utf8");
const chainSource = await readFile(
  new URL("../src/giwaChain.ts", import.meta.url),
  "utf8"
);
const environmentExample = await readFile(
  new URL("../.env.example", import.meta.url),
  "utf8"
);

test("configures Privy for EVM-only GIWA wallets", () => {
  assert.match(source, /walletChainType:\s*"ethereum-only"/);
  assert.doesNotMatch(source, /toSolanaWalletConnectors/);
  assert.doesNotMatch(source, /externalWallets:\s*\{\s*solana:/);
});

test("limits the GIWA login wallet choices", () => {
  assert.match(source, /loginMethods:\s*\["wallet", "email", "google"\]/);
  assert.match(source, /walletList:\s*\["metamask", "phantom", "okx_wallet"\]/);
  assert.match(source, /supportedChains:\s*\[giwaSepolia\]/);
});

test("allows production to use a dedicated GIWA RPC endpoint", () => {
  assert.match(chainSource, /VITE_GIWA_RPC_URL/);
  assert.match(chainSource, /https:\/\/sepolia-rpc\.giwa\.io/);
  assert.match(environmentExample, /^VITE_GIWA_RPC_URL=/m);
});
