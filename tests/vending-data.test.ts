import assert from "node:assert/strict";
import test from "node:test";
import {
  getAvailability,
  getPackDetail,
  getPackInventory,
  listPacks,
  listRecentPulls,
  pullPack
} from "../src/vendingData.ts";
import * as vendingData from "../src/vendingData.ts";
import { formatUsdc, formatUsdcRange } from "../src/currency.ts";

test("pack details publish the four ordered rarity tiers", async () => {
  const packs = await listPacks();

  assert.deepEqual(
    packs.map((pack) => pack.name),
    ["Debut", "Stage", "Encore", "Grail"]
  );

  for (const pack of packs) {
    const detail = await getPackDetail(pack.id);

    assert.ok(detail);
    assert.deepEqual(
      detail.rarityOdds.map((odds) => odds.tier),
      ["Common", "Rare", "Epic", "Legendary", "Iruka"]
    );
  }
});

test("pack summaries publish explicit tiers in Vending order", async () => {
  const packs = await listPacks();

  assert.deepEqual(
    packs.map((pack) => pack.tier),
    ["Debut", "Stage", "Encore", "Grail"]
  );
});

test("only the Debut pack is live while later tiers are coming soon", async () => {
  const packs = await listPacks();

  assert.equal(packs[0].status, "live");
  assert.ok(packs.slice(1).every((pack) => pack.status === "coming-soon"));
});

test("pack summaries use their supplied preview-pack media", async () => {
  const packs = await listPacks();

  for (const pack of packs) {
    assert.match(pack.media.coverUrl, new RegExp(`iruka-pack-${pack.id}\\.webp$`));
    assert.match(pack.media.packFrontUrl, new RegExp(`iruka-pack-${pack.id}\\.webp$`));
  }
});

test("each pack publishes its own rarity-odds distribution", async () => {
  const packs = await listPacks();
  const distributions = await Promise.all(
    packs.map(async (pack) => {
      const detail = await getPackDetail(pack.id);

      assert.ok(detail);
      return detail.rarityOdds.map((odds) => odds.basisPoints);
    })
  );

  assert.deepEqual(distributions, [
    [6000, 2800, 900, 200, 100],
    [5800, 2900, 1000, 200, 100],
    [5200, 3300, 1100, 300, 100],
    [5000, 3200, 1300, 400, 100]
  ]);
});

test("rarity selection uses basis-point boundaries", async () => {
  const detail = await getPackDetail("debut");
  const selectRarityByBasisPoints = vendingData.selectRarityByBasisPoints;

  assert.ok(detail);
  assert.equal(typeof selectRarityByBasisPoints, "function");
  assert.equal(selectRarityByBasisPoints(detail.rarityOdds, 0), "Common");
  assert.equal(selectRarityByBasisPoints(detail.rarityOdds, 0.9999), "Iruka");
});

test("pullPack draws only from the selected rarity tier", async () => {
  const originalRandom = Math.random;
  const rolls = [0.9999, 0, 0];
  Math.random = () => rolls.shift() ?? 0;

  try {
    const pull = await pullPack("debut");

    assert.equal(pull.card.tier, "Iruka");
  } finally {
    Math.random = originalRandom;
  }
});

test("pullPack excludes inventory already awarded in the session", async () => {
  const originalRandom = Math.random;
  Math.random = () => 0;

  try {
    const firstPull = await pullPack("debut");
    const secondPull = await pullPack("debut", {
      excludedCardIds: [firstPull.card.id]
    });

    assert.notEqual(secondPull.card.id, firstPull.card.id);
  } finally {
    Math.random = originalRandom;
  }
});

test("preview pulls ignore fixture availability states", async () => {
  const soldOutPull = await pullPack("encore");
  const comingSoonPull = await pullPack("grail");

  assert.equal(soldOutPull.packId, "encore");
  assert.equal(comingSoonPull.packId, "grail");
});

test("pack prices and inventory estimates are USDC decimal strings", async () => {
  const packs = await listPacks();
  const inventory = await getPackInventory(packs[0].id, { limit: 1 });

  for (const pack of packs) {
    assert.match(pack.priceUsdc, /^\d+\.\d{2}$/);
  }
  assert.match(inventory.items[0].estimatedValueRangeUsdc[0], /^\d+\.\d{2}$/);
  assert.match(inventory.items[0].estimatedValueRangeUsdc[1], /^\d+\.\d{2}$/);
});

test("pack odds publish eligible counts matching each batch supply", async () => {
  const packs = await listPacks();

  for (const pack of packs) {
    const detail = await getPackDetail(pack.id);

    assert.ok(detail);
    assert.equal(
      detail.rarityOdds.reduce((total, odds) => total + odds.eligibleCount, 0),
      detail.supply.total
    );
  }
});

test("Debut review inventory matches uniform onchain rarity odds exactly", async () => {
  const detail = await getPackDetail("debut");

  assert.ok(detail);
  assert.equal(detail.supply.total, 100);
  assert.deepEqual(
    detail.rarityOdds.map((odds) => odds.eligibleCount),
    [60, 28, 9, 2, 1]
  );
});

test("inventory card odds reconcile with each published rarity distribution", async () => {
  const packs = await listPacks();

  for (const pack of packs) {
    const detail = await getPackDetail(pack.id);
    const inventory = await getPackInventory(pack.id, { limit: 1000 });

    assert.ok(detail);
    assert.equal(
      inventory.items.reduce((total, card) => total + card.individualOddsBasisPoints, 0),
      10000
    );
    assert.ok(inventory.items.every((card) => Number.isInteger(card.individualOddsBasisPoints)));

    for (const rarity of detail.rarityOdds) {
      assert.equal(
        inventory.items
          .filter((card) => card.tier === rarity.tier)
          .reduce((total, card) => total + card.individualOddsBasisPoints, 0),
        rarity.basisPoints
      );
    }
  }
});

test("inventory represents every eligible card and stays within published value ranges", async () => {
  const packs = await listPacks();

  for (const pack of packs) {
    const detail = await getPackDetail(pack.id);
    const inventory = await getPackInventory(pack.id, { limit: 1000 });

    assert.ok(detail);
    assert.equal(inventory.total, pack.supply.total);

    for (const rarity of detail.rarityOdds) {
      const rarityCards = inventory.items.filter((card) => card.tier === rarity.tier);

      assert.equal(rarityCards.length, rarity.eligibleCount);
      assert.ok(rarityCards.every((card) =>
        card.estimatedValueRangeUsdc[0] === rarity.estimatedValueRangeUsdc[0]
        && card.estimatedValueRangeUsdc[1] === rarity.estimatedValueRangeUsdc[1]
      ));
    }
  }
});

test("availability becomes low stock at ten percent remaining", () => {
  assert.equal(getAvailability({ remaining: 10, total: 100 }), "low-stock");
  assert.equal(getAvailability({ remaining: 11, total: 100 }), "live");
});

test("an unreleased pack remains coming soon without virtual inventory status", () => {
  assert.equal(
    getAvailability({ configured: "coming-soon", remaining: 0, total: 100 }),
    "coming-soon"
  );
});

test("inventory exposes a 24-item first page with a next cursor", async () => {
  const packs = await listPacks();
  const page = await getPackInventory(packs[0].id, { limit: 24 });

  assert.equal(page.items.length, 24);
  assert.equal(page.total, packs[0].supply.total);
  assert.equal(page.nextCursor, 24);
});

test("inventory rarity filters apply before pagination", async () => {
  const page = await getPackInventory("debut", { limit: 24, rarity: "Iruka" });

  assert.equal(page.total, 1);
  assert.equal(page.nextCursor, undefined);
  assert.ok(page.items.every((card) => card.tier === "Iruka"));
});

test("recent pulls return only pulls supplied by the active session", async () => {
  const packs = await listPacks();
  const pull = await pullPack(packs[0].id);

  assert.deepEqual(await listRecentPulls([]), []);
  assert.deepEqual(await listRecentPulls([pull]), [pull]);
});

test("USDC formatting accepts decimal-string amounts", () => {
  assert.equal(formatUsdc("29.00"), "29.00 USDC");
});

test("USDC formatting preserves arbitrarily large decimal strings", () => {
  assert.equal(
    formatUsdc("123456789012345678901234567890.50"),
    "123,456,789,012,345,678,901,234,567,890.50 USDC"
  );
});

test("USDC range formatting keeps one currency suffix", () => {
  assert.equal(formatUsdcRange(["21.00", "57.00"]), "21.00 – 57.00 USDC");
});
