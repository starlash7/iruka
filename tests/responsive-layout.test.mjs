import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("desktop surfaces share a stable product canvas", async () => {
  const [stylesheet, vendingLayout] = await Promise.all([
    readFile(new URL("../src/styles.css", import.meta.url), "utf8"),
    readFile(new URL("../src/vending-layout.css", import.meta.url), "utf8")
  ]);

  assert.match(stylesheet, /\.product-shell\s*\{[\s\S]*?width: min\(1440px, 100%\);/);
  assert.match(stylesheet, /\.app-nav\s*\{[\s\S]*?width: 100vw;[\s\S]*?margin-inline: calc\(50% - 50vw\);/);
  assert.match(vendingLayout, /\.vending-page\s*\{[\s\S]*?width: 100%;[\s\S]*?margin: 0 auto;[\s\S]*?transform: none;/);
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
