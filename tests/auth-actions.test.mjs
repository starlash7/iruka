import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { after, before, test } from "node:test";
import { createServer } from "vite";

let server;
let getAuthenticatedGiwaWallet;
let getExternalLoginWalletAddress;
let getTransactionGiwaWallet;
let getWalletPromptAction;
let shouldHandleWalletPrompt;

before(async () => {
  server = await createServer({ appType: "custom", server: { middlewareMode: true } });
  ({
    getAuthenticatedGiwaWallet,
    getExternalLoginWalletAddress,
    getTransactionGiwaWallet,
    getWalletPromptAction,
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

test("uses an external EVM wallet explicitly connected in the current session", () => {
  const connectedWallet = {
    address: "0xAbCdEf",
    linked: false,
    type: "ethereum",
    walletClientType: "metamask"
  };

  assert.equal(
    getTransactionGiwaWallet(true, true, [connectedWallet], "0xabcdef"),
    connectedWallet
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

test("adopts a newly authenticated external EVM wallet for the current session", () => {
  assert.equal(
    getExternalLoginWalletAddress(false, {
      address: "0xexternal",
      chainType: "ethereum",
      type: "wallet",
      walletClientType: "metamask"
    }),
    "0xexternal"
  );
  assert.equal(
    getExternalLoginWalletAddress(true, {
      address: "0xexternal",
      chainType: "ethereum",
      type: "wallet",
      walletClientType: "metamask"
    }),
    undefined
  );
  assert.equal(
    getExternalLoginWalletAddress(false, {
      address: "solana-address",
      chainType: "solana",
      type: "wallet",
      walletClientType: "phantom"
    }),
    undefined
  );
});

test("handles each wallet prompt signal only once", () => {
  assert.equal(shouldHandleWalletPrompt(1, 0, true), true);
  assert.equal(shouldHandleWalletPrompt(1, 1, true), false);
  assert.equal(shouldHandleWalletPrompt(2, 1, true), true);
  assert.equal(shouldHandleWalletPrompt(2, 1, false), false);
});

test("pack prompts login but never auto-connect an external wallet", () => {
  assert.equal(getWalletPromptAction(1, 0, true, false), "login");
  assert.equal(getWalletPromptAction(1, 0, true, true), "none");
  assert.equal(getWalletPromptAction(1, 1, true, false), undefined);
});

test("primary authentication buttons use the subtle action beam", async () => {
  const source = await readFile(new URL("../src/PrivyAuthActions.tsx", import.meta.url), "utf8");

  assert.match(source, /<IrukaBeam className="auth-primary-beam" variant="action">/);
});

test("wallet authentication uses Privy's completed login flow", async () => {
  const source = await readFile(new URL("../src/PrivyAuthActions.tsx", import.meta.url), "utf8");

  assert.match(source, /useLogin\(\{/);
  assert.match(source, /onComplete:/);
  assert.doesNotMatch(source, /const \{ authenticated, login,/);
});

test("authenticated users get a profile menu instead of a wallet-address button", async () => {
  const [source, privySource] = await Promise.all([
    readFile(new URL("../src/AuthActions.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/PrivyAuthActions.tsx", import.meta.url), "utf8")
  ]);

  assert.match(source, /onOpenAccount:\s*\(\)\s*=>\s*void/);
  assert.doesNotMatch(source, /onOpenVault/);
  assert.match(source, /import \{ PrivyAuthActions \} from "\.\/PrivyAuthActions";/);
  assert.match(privySource, /import \{ ProfileMenu \} from "\.\/ProfileMenu";/);
  assert.match(privySource, /<ProfileMenu[\s\S]*?onOpenAccount=\{onOpenAccount\}/);
  assert.doesNotMatch(privySource, /auth-button-connected/);
  assert.doesNotMatch(privySource, /\{connectedLabel\}/);
});
