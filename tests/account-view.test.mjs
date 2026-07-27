import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { after, before, test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

const accountCopy = {
  account: "Account",
  address: "Wallet address",
  balance: "Balance",
  balanceError: "Balance unavailable",
  cards: "cards",
  cardsCollected: "Cards collected",
  close: "Close",
  collectionSummary: "Collection summary",
  copied: "Copied",
  copyAddress: "Copy address",
  deposit: "Deposit",
  empty: "Empty",
  faucet: "Open GIWA Faucet",
  inventory: "Inventory",
  inventoryValue: "Inventory FMV",
  listed: "Listed",
  loadingBalance: "Loading balance",
  network: "GIWA Sepolia",
  overview: "Overview",
  retry: "Retry",
  shipping: "Shipping",
  signOut: "Sign out",
  testEth: "Test ETH",
  wallet: "Wallet",
  walletDetails: "Wallet details"
};

let AccountPage;
let createAccountBalanceLoader;
let getAccountIdentity;
let getAccountInventorySummary;
let localizedCopy;
let server;

before(async () => {
  server = await createServer({
    appType: "custom",
    server: { hmr: false, middlewareMode: true }
  });

  const accountModule = await server.ssrLoadModule("/src/AccountView.tsx");

  ({
    AccountPage,
    createAccountBalanceLoader,
    getAccountIdentity,
    getAccountInventorySummary
  } = accountModule);
  ({ copy: localizedCopy } = await server.ssrLoadModule("/src/appCopy.ts"));
});

after(async () => {
  await server?.close();
});

function renderAccountPage(overrides = {}) {
  return renderToStaticMarkup(
    React.createElement(AccountPage, {
      address: "0x0000000000000000000000000000000000000001",
      balance: { label: "0.0012 ETH", status: "ready" },
      copy: accountCopy,
      depositOpen: false,
      identity: "collector@example.com",
      inventory: { estimatedValue: 184, listed: 1, shipping: 1, total: 3 },
      inventoryContent: React.createElement(
        "div",
        { className: "account-inventory-list-content" },
        "Woni: Pluschat"
      ),
      onCloseDeposit: () => undefined,
      onCopyAddress: () => undefined,
      onDeposit: () => undefined,
      onRetryBalance: () => undefined,
      ...overrides
    })
  );
}

test("Account page presents an Iruka IP profile with real account essentials", () => {
  assert.equal(typeof AccountPage, "function");

  const markup = renderAccountPage();

  assert.match(markup, /class="account-profile-hero"/);
  assert.match(markup, /class="account-profile-cover"/);
  assert.match(markup, /iruka-entry-sky-ocean\.png/);
  assert.match(markup, /class="account-profile-idols"/);
  assert.match(markup, /account-idols-transparent\.png/);
  assert.doesNotMatch(markup, /roadmap-iruka-universe\.jpg/);
  assert.doesNotMatch(markup, /<video|account-profile-cover\.mp4/);
  assert.match(markup, /class="account-profile-nav"/);
  assert.doesNotMatch(
    markup,
    /account-profile-cluster|account-profile-mark|account-identity|iruka-logo\.png/
  );
  assert.match(markup, /href="#account-overview"/);
  assert.match(markup, /href="#account-inventory"/);
  assert.match(markup, /id="account-overview"/);
  assert.match(markup, /class="account-summary-grid"/);
  assert.match(markup, /class="account-wallet-panel"/);
  assert.equal(markup.match(/class="account-stat /g)?.length, 2);
  assert.doesNotMatch(markup, /account-stat-listed|account-stat-shipping/);
  assert.match(markup, /class="account-inventory-panel" id="account-inventory"/);
  assert.doesNotMatch(markup, /account-profile-card|account-balance-card|account-avatar/);
  assert.match(markup, />Account</);
  assert.match(markup, />Overview</);
  assert.match(markup, />Deposit</);
  assert.match(markup, />Inventory FMV</);
  assert.match(markup, />\$184</);
  assert.match(markup, />Cards collected</);
  assert.match(markup, />Inventory</);
  assert.match(markup, /class="account-inventory-list"/);
  assert.match(markup, />Woni: Pluschat</);
  assert.doesNotMatch(markup, /View inventory|account-inventory-button/);
  assert.doesNotMatch(markup, />Sign out</);
  assert.match(markup, /0\.0012 ETH/);
  assert.doesNotMatch(markup, /class="account-heading"/);
  assert.doesNotMatch(markup, /class="account-overview"/);
  assert.doesNotMatch(markup, /Offers|Lending|Messages|Withdraw|Level|XP|Other/);
});

test("Wallet keeps only essential account actions and values", () => {
  const markup = renderAccountPage();
  const wallet = markup.match(
    /<article class="account-wallet-panel">([\s\S]*?)<\/article>/
  )?.[1];

  assert.ok(wallet);
  assert.match(wallet, />Wallet</);
  assert.match(wallet, /0\.0012 ETH/);
  assert.match(wallet, />Deposit</);
  assert.match(
    wallet,
    /class="account-wallet-heading"><h2>Wallet<\/h2><span aria-hidden="true">/
  );
  assert.doesNotMatch(wallet, /Sign out|account-wallet-sign-out/);
  assert.doesNotMatch(
    wallet,
    /GIWA Sepolia|Wallet details|>Balance<|Wallet address|Test ETH/
  );
});

test("Account primary actions reuse the Iruka action treatment", () => {
  const markup = renderAccountPage({ depositOpen: true });

  assert.match(
    markup,
    /class="account-deposit-button iruka-action-button"/
  );
  assert.match(
    markup,
    /class="account-faucet-action iruka-action-button"/
  );
  assert.match(
    markup,
    /class="account-address-button iruka-secondary-button"/
  );
  assert.match(
    markup,
    /class="account-copy-action iruka-secondary-button"/
  );
});

test("Account navigation and metrics use the compact Iruka type hierarchy", async () => {
  const [profileStyles, statStyles, balanceStyles, inventoryStyles, sharedStyles] =
    await Promise.all([
      readFile(new URL("../src/account-profile.css", import.meta.url), "utf8"),
      readFile(new URL("../src/account-stats.css", import.meta.url), "utf8"),
      readFile(new URL("../src/account-balance.css", import.meta.url), "utf8"),
      readFile(new URL("../src/account-inventory.css", import.meta.url), "utf8"),
      readFile(new URL("../src/styles.css", import.meta.url), "utf8")
    ]);

  assert.match(
    profileStyles,
    /\.account-profile-nav a \{[\s\S]*?text-decoration: none;/
  );
  assert.match(
    profileStyles,
    /\.account-profile-nav a \{[\s\S]*?font-size: 13px;[\s\S]*?font-weight: 550;/
  );
  assert.match(
    profileStyles,
    /\.account-profile-idols \{[\s\S]*?bottom: -32px;[\s\S]*?width: clamp\(250px, 26vw, 320px\);[\s\S]*?image-rendering: pixelated;[\s\S]*?pointer-events: none;/
  );
  assert.match(
    profileStyles,
    /@media \(max-width: 760px\) \{[\s\S]*?\.account-profile-idols \{[\s\S]*?bottom: -28px;[\s\S]*?width: min\(76%, 300px\);/
  );
  assert.match(
    statStyles,
    /\.account-stat-label \{[\s\S]*?color: var\(--muted\);[\s\S]*?font-size: 13px;[\s\S]*?font-weight: 550;/
  );
  assert.match(
    statStyles,
    /\.account-stat strong \{[\s\S]*?font-size: clamp\(27px, 2vw, 32px\);[\s\S]*?font-weight: 600;/
  );
  assert.match(
    balanceStyles,
    /\.account-wallet-heading h2 \{[\s\S]*?color: var\(--muted\);[\s\S]*?font-size: 13px;[\s\S]*?font-weight: 550;/
  );
  assert.match(
    balanceStyles,
    /\.account-balance-value \{[\s\S]*?font-size: clamp\(27px, 2vw, 32px\);[\s\S]*?font-weight: 600;/
  );
  assert.match(
    inventoryStyles,
    /\.account-inventory-panel h2 \{[\s\S]*?font-weight: 600;/
  );
  assert.match(
    inventoryStyles,
    /\.account-inventory-list \.vault-empty strong \{[\s\S]*?font-size: 15px;[\s\S]*?font-weight: 550;/
  );
  assert.match(
    sharedStyles,
    /\.iruka-secondary-button,[\s\S]*?font-family: var\(--font-sans\);[\s\S]*?border-radius: var\(--radius-pill\);/
  );
});

test("Account keeps its summary and Inventory visible on first render", () => {
  const markup = renderAccountPage();

  assert.doesNotMatch(markup, /class="account-wallet-sign-out"/);
  assert.match(
    markup,
    /class="account-summary-grid"[\s\S]*?account-stat-value[\s\S]*?account-stat-cards[\s\S]*?account-wallet-panel/
  );
  assert.match(markup, /class="account-inventory-list"/);
  assert.doesNotMatch(markup, /class="account-inventory-content"/);
  assert.doesNotMatch(markup, /View inventory|account-inventory-button/);
});

test("Account inventory excludes sold cards and counts actionable states", () => {
  assert.equal(typeof getAccountInventorySummary, "function");

  assert.deepEqual(
    getAccountInventorySummary([
      { estimatedValue: 12, vaultStatus: "Vaulted" },
      { estimatedValue: 25, vaultStatus: "Listed" },
      { estimatedValue: 40, vaultStatus: "Redeem queued" },
      { estimatedValue: 500, vaultStatus: "Sold" }
    ]),
    { estimatedValue: 77, listed: 1, shipping: 1, total: 3 }
  );
});

test("Account identity prefers a login name, then email, then wallet address", () => {
  const walletAddress = "0x0000000000000000000000000000000000000001";

  assert.equal(
    getAccountIdentity({
      email: { address: "collector@example.com" },
      google: { name: "Iruka Collector" }
    }, walletAddress),
    "Iruka Collector"
  );
  assert.equal(
    getAccountIdentity({
      email: { address: "collector@example.com" },
      google: null
    }, walletAddress),
    "collector@example.com"
  );
  assert.equal(getAccountIdentity(null, walletAddress), "0x0000...0001");
});

test("Account balance ignores stale results from an older request", async () => {
  const requests = [];
  const states = [];
  const loadBalance = createAccountBalanceLoader(
    (address) => new Promise((resolve, reject) => {
      requests.push({ address, reject, resolve });
    })
  );

  const firstLoad = loadBalance(
    "0x0000000000000000000000000000000000000001",
    (state) => states.push(state)
  );
  const secondLoad = loadBalance(
    "0x0000000000000000000000000000000000000002",
    (state) => states.push(state)
  );

  requests[1].resolve(2_000_000_000_000_000_000n);
  await secondLoad;
  requests[0].reject(new Error("stale request"));
  await firstLoad;

  assert.deepEqual(states, [
    { status: "loading" },
    { status: "loading" },
    { label: "2.0000 ETH", status: "ready" }
  ]);
});

test("Account hides zero status rows while keeping Inventory visible", () => {
  assert.equal(typeof AccountPage, "function");

  const markup = renderAccountPage({
    inventory: { estimatedValue: 0, listed: 0, shipping: 0, total: 0 }
  });

  assert.match(markup, />Inventory</);
  assert.match(markup, />Cards collected</);
  assert.match(markup, /<strong>0<\/strong>/);
  assert.doesNotMatch(markup, />Listed</);
  assert.doesNotMatch(markup, />Shipping</);
  assert.equal(markup.match(/class="account-stat /g)?.length, 2);
});

test("Deposit dialog exposes the connected address and official GIWA Faucet", () => {
  assert.equal(typeof AccountPage, "function");

  const markup = renderAccountPage({ depositOpen: true });

  assert.match(markup, />Wallet address</);
  assert.match(markup, /0x0000000000000000000000000000000000000001/);
  assert.match(markup, />Copy address</);
  assert.match(markup, />Open GIWA Faucet</);
  assert.match(markup, /href="https:\/\/faucet\.giwa\.io"/);
  assert.match(markup, /target="_blank"/);
  assert.doesNotMatch(markup, /Withdraw/);
});

test("Account copy is available in English and Korean", () => {
  assert.equal(localizedCopy.en.account.account, "Account");
  assert.equal(localizedCopy.en.account.deposit, "Deposit");
  assert.equal(localizedCopy.en.account.inventoryValue, "Inventory FMV");
  assert.equal(localizedCopy.en.account.overview, "Overview");
  assert.equal(localizedCopy.en.account.wallet, "Wallet");
  assert.equal(localizedCopy.en.account.walletDetails, "Wallet details");
  assert.equal(localizedCopy.ko.account.account, "계정");
  assert.equal(localizedCopy.ko.account.inventory, "인벤토리");
  assert.equal(localizedCopy.ko.account.cardsCollected, "보유 카드");
  assert.equal(localizedCopy.ko.account.overview, "개요");
  assert.equal(localizedCopy.ko.account.wallet, "지갑");
  assert.equal(localizedCopy.ko.account.walletDetails, "지갑 정보");
});
