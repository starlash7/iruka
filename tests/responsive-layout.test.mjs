import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

function getRelativeLuminance(hex) {
  const channels = [1, 3, 5]
    .map((index) => Number.parseInt(hex.slice(index, index + 2), 16) / 255)
    .map((channel) => (
      channel <= 0.04045
        ? channel / 12.92
        : ((channel + 0.055) / 1.055) ** 2.4
    ));

  return (0.2126 * channels[0]) + (0.7152 * channels[1]) + (0.0722 * channels[2]);
}

function getContrastRatio(firstHex, secondHex) {
  const first = getRelativeLuminance(firstHex);
  const second = getRelativeLuminance(secondHex);

  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

test("Account action colors keep normal-sized text at AA contrast", async () => {
  const stylesheet = await readFile(new URL("../src/account.css", import.meta.url), "utf8");
  const getColor = (name) => (
    stylesheet.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`, "i"))?.[1]
  );
  const action = getColor("account-action");
  const actionHover = getColor("account-action-hover");
  const danger = getColor("account-danger");

  assert.ok(action);
  assert.ok(actionHover);
  assert.ok(danger);
  assert.ok(getContrastRatio(action, "#edf5ff") >= 4.5);
  assert.ok(getContrastRatio("#ffffff", action) >= 4.5);
  assert.ok(getContrastRatio("#ffffff", actionHover) >= 4.5);
  assert.ok(getContrastRatio(danger, "#f3f7ff") >= 4.5);
});

test("Account layout is responsive and keeps touch targets usable", async () => {
  const stylesheet = (await Promise.all([
    "account.css",
    "account-profile.css",
    "account-balance.css",
    "account-inventory.css",
    "account-funds.css",
    "account-assets.css",
    "account-deposit.css",
    "account-transfer.css",
    "account-stats.css",
    "profile-menu.css"
  ].map((name) => readFile(new URL(`../src/${name}`, import.meta.url), "utf8"))))
    .join("\n");

  assert.match(
    stylesheet,
    /\.account-section\s*\{[^}]*max-width:\s*1600px;[^}]*padding-inline:\s*clamp\(14px,\s*2\.2vw,\s*30px\);/is
  );
  assert.match(
    stylesheet,
    /\.account-profile-hero\s*\{[^}]*min-height:\s*clamp\(300px,\s*24vw,\s*360px\);[^}]*border-radius:\s*var\(--radius-xl\);/is
  );
  assert.match(
    stylesheet,
    /\.account-profile-cover\s*\{[^}]*object-fit:\s*cover;[^}]*object-position:\s*center bottom;/is
  );
  assert.doesNotMatch(
    stylesheet,
    /\.account-profile-cluster|\.account-profile-mark|\.account-identity/
  );
  assert.match(
    stylesheet,
    /\.account-profile-nav\s*\{[^}]*left:\s*clamp\(24px,\s*3vw,\s*44px\);[^}]*bottom:\s*clamp\(26px,\s*3vw,\s*42px\);/is
  );
  assert.match(
    stylesheet,
    /\.account-balance-value\s*\{[^}]*overflow-wrap:\s*anywhere;[^}]*white-space:\s*normal;/is
  );
  assert.match(
    stylesheet,
    /\.account-summary-grid\s*\{[^}]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\);/is
  );
  assert.match(
    stylesheet,
    /\.account-stat-label\s*\{[^}]*position:\s*absolute;[^}]*top:\s*20px;[^}]*left:\s*20px;[^}]*font-size:\s*13px;/is
  );
  assert.match(
    stylesheet,
    /\.account-inventory-panel\s*\{[^}]*border:\s*0;[^}]*background:\s*transparent;[^}]*box-shadow:\s*none;/is
  );
  assert.match(
    stylesheet,
    /\.account-wallet-heading\s*\{[^}]*grid-template-columns:\s*44px\s*minmax\(0,\s*1fr\);/is
  );
  assert.doesNotMatch(stylesheet, /\.account-wallet-sign-out/);
  assert.match(
    stylesheet,
    /\.profile-menu-trigger\s*\{[^}]*width:\s*42px;[^}]*height:\s*42px;[^}]*border-radius:\s*50%;/is
  );
  assert.match(
    stylesheet,
    /\.profile-menu-popover\s*\{[^}]*right:\s*0;[^}]*width:\s*min\(280px,\s*calc\(100vw - 24px\)\);/is
  );
  assert.match(
    stylesheet,
    /\.nav-actions\.nav-actions-profile\s*\{[^}]*justify-content:\s*flex-end;/is
  );
  assert.match(
    stylesheet,
    /\.app-nav\.app-nav-profile\s*\{[^}]*overflow:\s*visible;/is
  );
  assert.match(
    stylesheet,
    /\.account-inventory-list \.vault-table\s*\{[^}]*grid-template-columns:\s*repeat\(6,\s*minmax\(0,\s*1fr\)\);/is
  );
  assert.match(
    stylesheet,
    /@media \(max-width:\s*1180px\)[\s\S]*?\.account-inventory-list \.vault-table\s*\{[^}]*grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\);/i
  );
  assert.match(
    stylesheet,
    /@media \(max-width:\s*760px\)[\s\S]*?\.account-inventory-list \.vault-table\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);/i
  );
  assert.match(
    stylesheet,
    /\.account-inventory-list \.vault-row \.vault-card-thumb\s*\{[^}]*display:\s*grid;[^}]*width:\s*100%;[^}]*height:\s*auto;/is
  );
  assert.match(
    stylesheet,
    /\.account-inventory-list \.vault-row > span:not\(\.vault-card-thumb\)\s*\{[^}]*display:\s*block;/is
  );
  assert.match(
    stylesheet,
    /@media \(max-width:\s*760px\)[\s\S]*?\.account-profile-hero\s*\{[^}]*min-height:\s*430px;/i
  );
  assert.match(
    stylesheet,
    /@media \(max-width:\s*760px\)[\s\S]*?\.account-summary-grid\s*\{[^}]*grid-template-columns:\s*1fr;/i
  );
  assert.doesNotMatch(stylesheet, /\.account-profile-card|\.account-balance-card/);
  assert.match(
    stylesheet,
    /\.account-add-funds-button,[\s\S]*?min-height:\s*44px;/i
  );
  assert.match(
    stylesheet,
    /\.account-funds-dialog::backdrop\s*\{[^}]*background:/is
  );
  assert.match(
    stylesheet,
    /\.account-funds-dialog\s*\{[^}]*width:\s*min\(460px,\s*calc\(100vw - 24px\)\);[^}]*max-height:\s*min\(760px,\s*calc\(100dvh - 24px\)\);/is
  );
  assert.match(
    stylesheet,
    /\.account-asset-grid\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);/is
  );
  assert.match(
    stylesheet,
    /\.account-asset-logo\s*\{[^}]*width:\s*100%;[^}]*height:\s*100%;[^}]*object-fit:\s*cover;/is
  );
  assert.match(
    stylesheet,
    /@media \(max-width:\s*480px\)[\s\S]*?\.account-asset-grid\s*\{[^}]*grid-template-columns:\s*1fr;/i
  );
  assert.doesNotMatch(stylesheet, /font-weight:\s*800/);
});

test("desktop surfaces share a stable product canvas", async () => {
  const [stylesheet, vendingLayout] = await Promise.all([
    readFile(new URL("../src/styles.css", import.meta.url), "utf8"),
    readFile(new URL("../src/vending-layout.css", import.meta.url), "utf8")
  ]);

  assert.match(stylesheet, /\.product-shell\s*\{[\s\S]*?width: min\(1440px, 100%\);/);
  assert.match(stylesheet, /\.app-nav\s*\{[\s\S]*?width: 100vw;[\s\S]*?margin-inline: calc\(50% - 50vw\);/);
  assert.match(vendingLayout, /\.vending-page\s*\{[\s\S]*?width: 100%;[\s\S]*?margin: 0 auto;[\s\S]*?transform: none;/);
});

test("primary navigation keeps the Oxanium labels prominent", async () => {
  const stylesheet = await readFile(
    new URL("../src/styles.css", import.meta.url),
    "utf8"
  );

  assert.match(
    stylesheet,
    /\.nav-links button,\s*\.nav-links a \{[^}]*min-height: 64px;[^}]*color: var\(--ink\);[^}]*font-size: 14px;[^}]*font-weight: 600;/
  );
  assert.match(
    stylesheet,
    /\.nav-links button:hover,\s*\.nav-links a:hover,\s*\.nav-links button\.selected \{[^}]*color: var\(--ink\);/
  );
});

test("wide Vending and Marketplace surfaces stay dense on desktop", async () => {
  const [stylesheet, vendingInventory, vendingLayout, vendingResponsive] = await Promise.all([
    readFile(new URL("../src/styles.css", import.meta.url), "utf8"),
    readFile(new URL("../src/vending-inventory.css", import.meta.url), "utf8"),
    readFile(new URL("../src/vending-layout.css", import.meta.url), "utf8"),
    readFile(new URL("../src/vending-responsive.css", import.meta.url), "utf8")
  ]);

  assert.match(vendingLayout, /\.vending-page\s*\{[\s\S]*?max-width: 1600px;[\s\S]*?margin: 0 auto;/);
  assert.match(vendingLayout, /\.vending-detail\s*\{[\s\S]*?align-items: start;/);
  assert.match(vendingLayout, /\.vending-detail-media\s*\{[\s\S]*?width: min\(100%, 640px\);/);
  assert.match(stylesheet, /\.marketplace-page\s*\{[\s\S]*?max-width: 1600px;[\s\S]*?margin: clamp\(24px, 3vw, 42px\) auto 0;/);
  assert.match(stylesheet, /\.marketplace-grid\s*\{[\s\S]*?grid-template-columns: repeat\(6, minmax\(0, 1fr\)\);/);
  assert.match(vendingInventory, /\.vending-inventory-grid\s*\{[\s\S]*?grid-template-columns: repeat\(6, minmax\(0, 1fr\)\);/);
  assert.match(vendingResponsive, /@media \(max-width: 1280px\)[\s\S]*?\.vending-inventory-grid\s*\{ grid-template-columns: repeat\(4, minmax\(0, 1fr\)\); \}/);
  assert.match(vendingResponsive, /@media \(max-width: 1100px\)[\s\S]*?\.vending-detail-media\s*\{ width: min\(100%, 640px\);/);
});

test("tablet home layout keeps the character and purchase panel in a two-column flow", async () => {
  const stylesheet = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");

  assert.match(stylesheet, /@media \(min-width: 761px\) and \(max-width: 1120px\)[\s\S]*?\.home-character\s*\{[\s\S]*?position: relative;/);
  assert.match(stylesheet, /@media \(min-width: 761px\) and \(max-width: 1120px\)[\s\S]*?\.home-panel\s*\{[\s\S]*?grid-template-columns: minmax\(0, 1fr\) minmax\(220px, 280px\);/);
  assert.match(stylesheet, /@media \(min-width: 761px\) and \(max-width: 1120px\)[\s\S]*?\.home-brandline-line\s*\{[\s\S]*?white-space: normal;/);
});

test("desktop home wordmark stays above the character composition", async () => {
  const stylesheet = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");

  assert.match(stylesheet, /\.home-brandline > span\s*\{[\s\S]*?transform: translate\(184px, 44px\) skew\(-6deg\);/);
});

test("compact UI metadata never drops below ten pixels", async () => {
  const stylesheets = await Promise.all([
    "styles.css",
    "vending-inventory.css"
  ].map((name) => readFile(new URL(`../src/${name}`, import.meta.url), "utf8")));

  for (const stylesheet of stylesheets) {
    assert.doesNotMatch(stylesheet, /font-size:\s*[89]px;/);
  }
});
