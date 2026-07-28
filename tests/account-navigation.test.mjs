import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("Account is a protected app view opened from the connected wallet", async () => {
  const [appSource, chromeSource, typesSource] = await Promise.all([
    readFile(new URL("../src/App.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/AppChrome.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/appTypes.ts", import.meta.url), "utf8")
  ]);

  assert.match(typesSource, /"account"/);
  assert.match(chromeSource, /onOpenAccount=\{\(\) => onShowView\("account"\)\}/);
  assert.match(
    appSource,
    /if \(\(view === "vault" \|\| view === "account"\) && walletRequired\)/
  );
  assert.match(appSource, /activeView === "account"/);
  assert.match(appSource, /<AccountView/);
  assert.match(appSource, /copy=\{t\.account\}/);
  assert.match(appSource, /inventoryContent=\{/);
  assert.match(appSource, /<VaultCardList/);
  assert.doesNotMatch(appSource, /onOpenInventory/);
});

test("the Account stylesheet is loaded by the application entry", async () => {
  const source = await readFile(new URL("../src/main.tsx", import.meta.url), "utf8");

  assert.match(source, /import "\.\/account\.css";/);
  assert.match(source, /import "\.\/account-profile\.css";/);
  assert.doesNotMatch(source, /account-profile-media\.css/);
  assert.match(source, /import "\.\/account-balance\.css";/);
  assert.match(source, /import "\.\/account-inventory\.css";/);
  assert.match(source, /import "\.\/account-funds\.css";/);
  assert.match(source, /import "\.\/account-assets\.css";/);
  assert.match(source, /import "\.\/account-deposit\.css";/);
  assert.match(source, /import "\.\/account-transfer\.css";/);
});

test("Funds dialogs and header sign-out reuse the accessible session lifecycle", async () => {
  const [
    accountSource,
    appSource,
    authSource,
    addFundsSource,
    fundingMethodsSource,
    withdrawSource,
    dialogSource
  ] = await Promise.all([
    readFile(new URL("../src/AccountView.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/App.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/PrivyAuthActions.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/AccountAddFundsDialog.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/AccountFundingMethods.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/AccountWithdrawDialog.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/MarketplaceDialog.tsx", import.meta.url), "utf8")
  ]);

  assert.match(accountSource, /navigator\.clipboard\.writeText\(walletAddress\)/);
  assert.doesNotMatch(accountSource, /clearExternalWalletSession|await logout\(\)/);
  assert.match(authSource, /clearExternalWalletSession\(\);[\s\S]*?await logout\(\);/);
  assert.match(addFundsSource, /AccountFundingMethods/);
  assert.match(fundingMethodsSource, /data-autofocus/);
  assert.match(withdrawSource, /data-autofocus/);
  assert.match(dialogSource, /returnFocusRef\.current = document\.activeElement/);
  assert.match(dialogSource, /returnFocusRef\.current\?\.focus\(\)/);
  assert.match(
    appSource,
    /if \(walletAuth !== "privy" \|\| !wasSignedIn \|\| isSignedIn\) return;[\s\S]*?setActiveView\("home"\);/
  );
});

test("app views update browser history and restore revealed inventory", async () => {
  const [appSource, chromeSource] = await Promise.all([
    readFile(new URL("../src/App.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/AppChrome.tsx", import.meta.url), "utf8")
  ]);

  assert.match(appSource, /window\.history\.pushState/);
  assert.match(appSource, /window\.addEventListener\("popstate"/);
  assert.match(appSource, /getWalletCardCollection\(/);
  assert.match(appSource, /saveWalletCardCollection\(/);
  assert.match(
    appSource,
    /setCollection\(\(items\) =>[\s\S]*?pendingReveal/
  );
  assert.match(chromeSource, /onClick=\{\(\) => onShowView\("home"\)\}/);
  assert.doesNotMatch(chromeSource, /className="header-wordmark" href="\/"/);
});
