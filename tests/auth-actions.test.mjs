import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { after, before, test } from "node:test";
import { createServer } from "vite";

let server;
let getExternalLoginWalletAddress;
let getExternalGiwaWallet;
let getIrukaAccountWallet;
let getWalletPromptAction;
let getExternalWalletSessionAddress;
let saveExternalWalletSession;
let clearExternalWalletSession;
let shouldHandleWalletPrompt;

before(async () => {
  server = await createServer({
    appType: "custom",
    optimizeDeps: { noDiscovery: true },
    server: { hmr: false, middlewareMode: true }
  });
  ({
    getExternalLoginWalletAddress,
    getExternalGiwaWallet,
    getIrukaAccountWallet,
    getWalletPromptAction,
    getExternalWalletSessionAddress,
    saveExternalWalletSession,
    clearExternalWalletSession,
    shouldHandleWalletPrompt
  } = await server.ssrLoadModule("/src/walletConnection.ts"));
});

after(async () => {
  await server?.close();
});

test("keeps the authenticated session while Privy wallets are still loading", () => {
  assert.equal(
    getIrukaAccountWallet(true, false, []),
    undefined
  );
});

test("uses the Privy embedded wallet as the Iruka account wallet", () => {
  const externalWallet = {
    address: "0xexternal",
    linked: true,
    type: "ethereum",
    walletClientType: "metamask"
  };
  const embeddedWallet = {
    address: "0xembedded",
    linked: true,
    type: "ethereum",
    walletClientType: "privy"
  };

  assert.equal(
    getIrukaAccountWallet(true, true, [externalWallet, embeddedWallet]),
    embeddedWallet
  );
  assert.equal(
    getIrukaAccountWallet(true, true, [externalWallet]),
    undefined
  );
});

test("keeps the current external wallet only as a funding source", () => {
  const connectedWallet = {
    address: "0xAbCdEf",
    linked: false,
    type: "ethereum",
    walletClientType: "metamask"
  };

  assert.equal(
    getExternalGiwaWallet(true, true, [connectedWallet], "0xabcdef"),
    connectedWallet
  );
  assert.equal(getExternalGiwaWallet(true, true, [connectedWallet]), undefined);
});

test("never treats the Privy embedded wallet as an external funding wallet", () => {
  const embeddedWallet = {
    address: "0xembedded",
    linked: true,
    type: "ethereum",
    walletClientType: "privy"
  };

  assert.equal(
    getExternalGiwaWallet(true, true, [embeddedWallet], "0xembedded"),
    undefined
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

test("session storage restrictions do not break wallet authentication", () => {
  const restrictedStorage = {
    getItem: () => {
      throw new DOMException("Blocked", "SecurityError");
    },
    removeItem: () => {
      throw new DOMException("Blocked", "SecurityError");
    },
    setItem: () => {
      throw new DOMException("Blocked", "SecurityError");
    }
  };

  assert.equal(getExternalWalletSessionAddress(restrictedStorage), undefined);
  assert.doesNotThrow(() =>
    saveExternalWalletSession("0xexternal", restrictedStorage)
  );
  assert.doesNotThrow(() => clearExternalWalletSession(restrictedStorage));
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

test("all login methods receive an Iruka embedded wallet", async () => {
  const [mainSource, authSource] = await Promise.all([
    readFile(new URL("../src/app-main.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/PrivyAuthActions.tsx", import.meta.url), "utf8")
  ]);

  assert.match(mainSource, /createOnLogin:\s*"all-users"/);
  assert.match(authSource, /useCreateWallet/);
  assert.match(authSource, /getIrukaAccountWallet/);
  assert.match(authSource, /getExternalGiwaWallet/);
});

test("signed-in users can explicitly connect an external EVM funding wallet", async () => {
  const [appSource, headerSource, authSource] = await Promise.all([
    readFile(new URL("../src/App.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/AppChrome.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/PrivyAuthActions.tsx", import.meta.url), "utf8")
  ]);

  assert.match(appSource, /externalWalletPromptSignal/);
  assert.match(appSource, /onConnectExternalWallet=/);
  assert.match(headerSource, /externalConnectSignal/);
  assert.match(authSource, /useConnectWallet\(\{/);
  assert.match(authSource, /walletChainType:\s*"ethereum-only"/);
  assert.match(
    authSource,
    /walletList:\s*\["metamask", "phantom", "okx_wallet"\]/
  );
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
