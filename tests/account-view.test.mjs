import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { after, before, test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

const accountCopy = {
  account: "Account",
  addFunds: "Add funds",
  address: "Iruka Wallet address",
  amount: "Amount",
  back: "Back",
  balance: "Balance",
  balanceError: "Balance unavailable",
  cards: "cards",
  cardsCollected: "Cards collected",
  chain: "Chain",
  close: "Close",
  collectionSummary: "Collection summary",
  comingSoon: "Coming soon",
  connectExchange: "Connect exchange",
  connectWallet: "Connect wallet",
  copied: "Copied",
  copyAddress: "Copy address",
  destination: "Destination",
  done: "Done",
  enterAmount: "Enter amount",
  enterRecipient: "Enter recipient address",
  empty: "Empty",
  ethereum: "Ethereum",
  faucet: "Open GIWA Faucet",
  fromConnectedWallet: "Transfer from connected wallet",
  giwaSepolia: "GIWA Sepolia",
  inventory: "Inventory",
  inventoryValue: "Inventory FMV",
  listed: "Listed",
  loadingBalance: "Loading balance",
  network: "GIWA Sepolia",
  networkFee: "Network fee",
  overview: "Overview",
  receiveChain: "Receive chain",
  receiveToken: "Receive token",
  retry: "Retry",
  shownInWallet: "Shown in wallet",
  shipping: "Shipping",
  signOut: "Sign out",
  testEth: "ETH",
  token: "Token",
  transfer: "Transfer",
  transferComplete: "Transfer complete",
  transferCrypto: "Transfer crypto",
  transferFailed: "Transaction failed",
  transferring: "Confirming",
  upbit: "Upbit",
  viewTransaction: "View transaction",
  wallet: "Iruka Wallet",
  walletDetails: "Wallet details",
  withdraw: "Withdraw",
  youWillReceive: "You will receive"
};

let AccountPage;
let AccountCryptoDepositPanel;
let TransferComplete;
let createAccountBalanceLoader;
let getAccountIdentity;
let getAccountInventorySummary;
let localizedCopy;
let server;

before(async () => {
  server = await createServer({
    appType: "custom",
    optimizeDeps: { noDiscovery: true },
    server: { hmr: false, middlewareMode: true }
  });

  const accountModule = await server.ssrLoadModule("/src/AccountView.tsx");

  ({
    AccountPage,
    createAccountBalanceLoader,
    getAccountIdentity,
    getAccountInventorySummary
  } = accountModule);
  ({ AccountCryptoDepositPanel } = await server.ssrLoadModule(
    "/src/AccountCryptoDepositPanel.tsx"
  ));
  ({ TransferComplete } = await server.ssrLoadModule(
    "/src/AccountFundsDialogShared.tsx"
  ));
  ({ copy: localizedCopy } = await server.ssrLoadModule("/src/appCopy.ts"));
});

after(async () => {
  await server?.close();
});

function renderAccountPage(overrides = {}) {
  return renderToStaticMarkup(
    React.createElement(AccountPage, {
      address: "0x0000000000000000000000000000000000000001",
      addFundsOpen: false,
      balance: { label: "0.0012 ETH", status: "ready" },
      copy: accountCopy,
      externalWalletAddress: "0x0000000000000000000000000000000000000002",
      identity: "collector@example.com",
      inventory: { estimatedValue: 184, listed: 1, shipping: 1, total: 3 },
      inventoryContent: React.createElement(
        "div",
        { className: "account-inventory-list-content" },
        "Woni: Pluschat"
      ),
      onAddFunds: () => undefined,
      onAddFundsTransfer: async () => ({
        explorerUrl: "https://sepolia-explorer.giwa.io/tx/0x1",
        transactionHash: "0x1"
      }),
      onCloseAddFunds: () => undefined,
      onCloseWithdraw: () => undefined,
      onConnectExternalWallet: () => undefined,
      onCopyAddress: () => undefined,
      onRetryBalance: () => undefined,
      onTransferComplete: () => undefined,
      onWithdraw: () => undefined,
      onWithdrawTransfer: async () => ({
        explorerUrl: "https://sepolia-explorer.giwa.io/tx/0x1",
        transactionHash: "0x1"
      }),
      withdrawOpen: false,
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
  assert.match(markup, /src="\/assets\/iruka-icon-overview\.png"/);
  assert.match(markup, /src="\/assets\/iruka-icon-inventory\.png"/);
  assert.match(markup, /src="\/assets\/iruka-icon-wallet\.png"/);
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
  assert.doesNotMatch(markup, /account-stat-icon/);
  assert.match(markup, /class="account-inventory-panel" id="account-inventory"/);
  assert.ok(
    markup.indexOf("iruka-icon-inventory.png", markup.indexOf("account-inventory-panel")) <
      markup.indexOf("<h2>Inventory</h2>", markup.indexOf("account-inventory-panel"))
  );
  assert.doesNotMatch(markup, /account-profile-card|account-balance-card|account-avatar/);
  assert.match(markup, />Account</);
  assert.match(markup, />Overview</);
  assert.match(markup, />Add funds</);
  assert.match(markup, />Withdraw</);
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
  assert.doesNotMatch(markup, /Offers|Lending|Messages|Level|XP|Other/);
});

test("Wallet keeps only essential account actions and values", () => {
  const markup = renderAccountPage();
  const wallet = markup.match(
    /<article class="account-wallet-panel">([\s\S]*?)<\/article>/
  )?.[1];

  assert.ok(wallet);
  assert.match(wallet, />Iruka Wallet</);
  assert.match(wallet, /0\.0012 ETH/);
  assert.match(wallet, />Add funds</);
  assert.match(wallet, />Withdraw</);
  assert.ok(
    wallet.indexOf("iruka-icon-wallet.png") < wallet.indexOf("<h2>Iruka Wallet</h2>")
  );
  assert.doesNotMatch(wallet, /Sign out|account-wallet-sign-out/);
  assert.doesNotMatch(
    wallet,
    /GIWA Sepolia|Wallet details|>Balance<|Wallet address|Test ETH/
  );
});

test("Account primary actions reuse the Iruka action treatment", () => {
  const markup = renderAccountPage({ addFundsOpen: true });

  assert.match(
    markup,
    /class="account-add-funds-button iruka-action-button"/
  );
  assert.match(
    markup,
    /class="account-withdraw-button iruka-secondary-button"/
  );
  assert.match(
    markup,
    /class="account-address-button iruka-secondary-button"/
  );
});

test("Account blocks another funds action while a submitted transfer is pending", () => {
  const markup = renderAccountPage({ transferPending: true });

  assert.match(
    markup,
    /class="account-add-funds-button iruka-action-button" disabled=""/
  );
  assert.match(
    markup,
    /class="account-withdraw-button iruka-secondary-button" disabled=""/
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
    /\.account-profile-nav a \{[\s\S]*?min-height: 52px;[\s\S]*?font-size: 13px;[\s\S]*?font-weight: 550;/
  );
  assert.match(
    profileStyles,
    /\.account-nav-icon \{[\s\S]*?width: 44px;[\s\S]*?height: 44px;/
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
  assert.doesNotMatch(statStyles, /\.account-stat-icon/);
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
    balanceStyles,
    /\.account-wallet-heading > span img \{[\s\S]*?width: 44px;[\s\S]*?height: 44px;/
  );
  assert.match(
    inventoryStyles,
    /\.account-inventory-panel h2 \{[\s\S]*?font-weight: 600;/
  );
  assert.match(
    inventoryStyles,
    /\.account-inventory-panel > header \{[\s\S]*?justify-content: flex-start;/
  );
  assert.match(
    inventoryStyles,
    /\.account-inventory-icon img \{[\s\S]*?width: 46px;[\s\S]*?height: 46px;/
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

test("Add funds starts with real crypto transfer and disabled exchange methods", () => {
  assert.equal(typeof AccountPage, "function");

  const markup = renderAccountPage({ addFundsOpen: true });

  assert.match(markup, /id="account-add-funds-title">Add funds</);
  assert.match(markup, />Transfer crypto</);
  assert.match(markup, />GIWA Sepolia · ETH</);
  assert.match(markup, />Connect exchange</);
  assert.match(markup, />Upbit · Coming soon</);
  assert.match(markup, /src="\/assets\/wallet-upbit\.png"/);
  assert.match(markup, /src="\/assets\/wallet-ethereum\.png"/);
  assert.match(markup, /src="\/assets\/wallet-giwa\.png"/);
  assert.match(markup, /class="account-funding-method account-funding-method-disabled" disabled=""/);
  assert.doesNotMatch(markup, />Iruka Wallet address</);
});

test("Crypto deposit exposes the Iruka address and only enables GIWA test ETH", () => {
  assert.equal(typeof AccountCryptoDepositPanel, "function");

  const markup = renderToStaticMarkup(
    React.createElement(AccountCryptoDepositPanel, {
      address: "0x0000000000000000000000000000000000000001",
      copied: false,
      copy: accountCopy,
      externalWalletAddress: "0x0000000000000000000000000000000000000002",
      onConnectWallet: () => undefined,
      onCopyAddress: () => undefined,
      onTransfer: async () => ({
        explorerUrl: "https://sepolia-explorer.giwa.io/tx/0x1",
        transactionHash: "0x1"
      }),
      onTransferComplete: () => undefined
    })
  );

  assert.match(markup, />Iruka Wallet address</);
  assert.match(markup, /0x0000000000000000000000000000000000000001/);
  assert.match(markup, /data-funds-menu="token"/);
  assert.match(markup, /src="\/assets\/wallet-ethereum\.png"/);
  assert.match(markup, /src="\/assets\/wallet-usdc\.png"/);
  assert.match(markup, /src="\/assets\/wallet-usdt\.png"/);
  assert.match(markup, /data-funds-menu="chain"/);
  assert.match(markup, /src="\/assets\/wallet-giwa\.png"/);
  assert.match(markup, />ETH</);
  assert.match(markup, />USDC</);
  assert.match(markup, />USDT</);
  assert.match(markup, />GIWA Sepolia</);
  assert.match(markup, />Ethereum</);
  assert.doesNotMatch(markup, />Connected wallet</);
  assert.doesNotMatch(markup, /0x0000000000000000000000000000000000000002/);
  assert.match(markup, />Transfer from connected wallet</);
  assert.match(markup, />Transfer</);
  assert.match(markup, />Copy address</);
  assert.match(markup, />Open GIWA Faucet</);
  assert.match(markup, /href="https:\/\/faucet\.giwa\.io"/);
  assert.match(markup, /target="_blank"/);
});

test("completed transfers replace the form with a dedicated receipt view", async () => {
  const markup = renderToStaticMarkup(
    React.createElement(TransferComplete, {
      amount: "0.001",
      copy: accountCopy,
      explorerUrl: "https://sepolia-explorer.giwa.io/tx/0x1",
      onDone: () => undefined
    })
  );
  const [depositSource, withdrawSource] = await Promise.all([
    readFile(new URL("../src/AccountCryptoDepositPanel.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/AccountWithdrawDialog.tsx", import.meta.url), "utf8")
  ]);

  assert.match(markup, />Transfer complete</);
  assert.match(markup, />0\.001 ETH</);
  assert.match(markup, />View transaction</);
  assert.match(markup, />Done</);
  assert.match(depositSource, /state\.status === "complete"[\s\S]*?<TransferComplete/);
  assert.match(withdrawSource, /state\.status === "complete"[\s\S]*?<TransferComplete/);
});

test("Withdraw requires an explicit destination address", () => {
  const markup = renderAccountPage({ withdrawOpen: true });

  assert.match(markup, /id="account-withdraw-title">Withdraw</);
  assert.match(markup, />Destination</);
  assert.match(markup, /placeholder="0x\.\.\."/);
  assert.doesNotMatch(
    markup,
    /0x0000000000000000000000000000000000000002/
  );
  assert.match(markup, />Amount</);
  assert.match(markup, />Receive token</);
  assert.match(markup, />Receive chain</);
  assert.match(markup, />You will receive</);
  assert.match(markup, />Network fee</);
  assert.match(markup, />Shown in wallet</);
  assert.match(markup, /data-funds-menu="token"/);
  assert.match(markup, /src="\/assets\/wallet-usdc\.png"/);
  assert.match(markup, /src="\/assets\/wallet-usdt\.png"/);
  assert.match(markup, /data-funds-menu="chain"/);
  assert.match(markup, /src="\/assets\/wallet-giwa\.png"/);
  assert.match(markup, />Enter recipient address</);
});

test("Account copy is available in English and Korean", () => {
  assert.equal(localizedCopy.en.account.account, "Account");
  assert.equal(localizedCopy.en.account.addFunds, "Add funds");
  assert.equal(localizedCopy.en.account.transferComplete, "Transfer complete");
  assert.equal(localizedCopy.en.account.withdraw, "Withdraw");
  assert.equal(localizedCopy.en.account.inventoryValue, "Inventory FMV");
  assert.equal(localizedCopy.en.account.overview, "Overview");
  assert.equal(localizedCopy.en.account.wallet, "Iruka Wallet");
  assert.equal(localizedCopy.en.account.walletDetails, "Wallet details");
  assert.equal(localizedCopy.en.account.transferCrypto, "Transfer crypto");
  assert.equal(localizedCopy.en.account.connectExchange, "Connect exchange");
  assert.equal(localizedCopy.en.account.receiveToken, "Receive token");
  assert.equal(localizedCopy.en.account.testEth, "ETH");
  assert.equal(localizedCopy.ko.account.account, "계정");
  assert.equal(localizedCopy.ko.account.inventory, "인벤토리");
  assert.equal(localizedCopy.ko.account.cardsCollected, "보유 카드");
  assert.equal(localizedCopy.ko.account.overview, "개요");
  assert.equal(localizedCopy.ko.account.wallet, "Iruka Wallet");
  assert.equal(localizedCopy.ko.account.addFunds, "충전");
  assert.equal(localizedCopy.ko.account.transferComplete, "전송 완료");
  assert.equal(localizedCopy.ko.account.withdraw, "출금");
  assert.equal(localizedCopy.ko.account.walletDetails, "지갑 정보");
  assert.equal(localizedCopy.ko.account.transferCrypto, "코인 보내기");
  assert.equal(localizedCopy.ko.account.connectExchange, "거래소 연결");
  assert.equal(localizedCopy.ko.account.receiveChain, "받을 체인");
  assert.equal(localizedCopy.ko.account.testEth, "ETH");
});

test("crypto funding offers an explicit wallet connection when needed", async () => {
  const source = await readFile(
    new URL("../src/AccountCryptoDepositPanel.tsx", import.meta.url),
    "utf8"
  );

  assert.match(source, /onConnectWallet:\s*\(\)\s*=>\s*void/);
  assert.match(source, /\{externalWalletAddress \? \(/);
  assert.match(source, /copy\.connectWallet/);
  assert.match(source, /onClick=\{onConnectWallet\}/);
});

test("deposit confirmation is persisted under the Iruka account address", async () => {
  const source = await readFile(
    new URL("../src/AccountView.tsx", import.meta.url),
    "utf8"
  );

  assert.match(
    source,
    /createPendingGiwaTransfer\(\{[\s\S]*?walletAddress[\s\S]*?\}\)/
  );
  assert.doesNotMatch(source, /walletAddress:\s*sender\.address/);
  assert.match(
    source,
    /clearPendingGiwaTransfer\([\s\S]*?window\.localStorage,[\s\S]*?walletAddress,[\s\S]*?receipt\.transactionHash/
  );
});
