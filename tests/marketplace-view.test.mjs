import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("Marketplace cards do not keep a fixed animated featured beam", async () => {
  const [tileSource, viewSource, stylesheet] = await Promise.all([
    readFile(new URL("../src/MarketplaceCardTile.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/MarketplaceView.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/styles.css", import.meta.url), "utf8")
  ]);

  assert.doesNotMatch(tileSource, /IrukaBeam|featured/);
  assert.doesNotMatch(viewSource, /featuredId|featured=/);
  assert.doesNotMatch(stylesheet, /market-card-beam|market-beam-shift/);
});

test("Marketplace cards omit the release and condition line above the price", async () => {
  const tileSource = await readFile(
    new URL("../src/MarketplaceCardTile.tsx", import.meta.url),
    "utf8"
  );

  assert.doesNotMatch(tileSource, /item\.card\.release/);
  assert.doesNotMatch(tileSource, /getMarketplaceConditionLabel/);
});
