import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
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

test("Marketplace cards omit secondary condition metadata", async () => {
  const tileSource = await readFile(
    new URL("../src/MarketplaceCardTile.tsx", import.meta.url),
    "utf8"
  );

  assert.doesNotMatch(tileSource, /getMarketplaceConditionLabel/);
});

test("Marketplace does not render the sell from vault section", async () => {
  const viewSource = await readFile(
    new URL("../src/MarketplaceView.tsx", import.meta.url),
    "utf8"
  );

  assert.doesNotMatch(viewSource, /MarketplaceOwnedCards/);
});

test("Marketplace card tiles keep the pink group above a black member and release line", async () => {
  const [tileSource, stylesheet] = await Promise.all([
    readFile(new URL("../src/MarketplaceCardTile.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/styles.css", import.meta.url), "utf8")
  ]);

  assert.match(tileSource, /className="market-card-group">\{item\.card\.group\}/);
  assert.match(
    tileSource,
    /className="market-card-name">\{item\.card\.member\}\s*·\s*\{item\.card\.release\}/
  );
  assert.doesNotMatch(tileSource, /getMarketplaceCardTypeLabel|market-card-type/);
  assert.match(
    stylesheet,
    /\.market-card-copy > \.market-card-group\s*\{[^}]*color:\s*#c54884;/is
  );
  assert.match(
    stylesheet,
    /\.market-card-copy > \.market-card-name\s*\{[^}]*color:\s*var\(--ink\);[^}]*white-space:\s*nowrap;/is
  );
});

test("Home photocards match the Marketplace group and name treatment", async () => {
  const [homeSource, stylesheet] = await Promise.all([
    readFile(new URL("../src/HomeDiscovery.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/styles.css", import.meta.url), "utf8")
  ]);

  assert.match(homeSource, /className="home-market-card-group">\{item\.card\.group\}/);
  assert.match(
    homeSource,
    /className="home-market-card-name">\{item\.card\.member\}\s*·\s*\{item\.card\.release\}/
  );
  assert.doesNotMatch(homeSource, /getMarketplaceCardTypeLabel|item\.card\.cardType/);
  assert.match(stylesheet, /\.home-market-card-copy > \.home-market-card-group\s*\{[^}]*color:\s*#c54884;/is);
  assert.match(
    stylesheet,
    /\.home-market-card-copy > \.home-market-card-name\s*\{[^}]*color:\s*var\(--ink\);[^}]*font-weight:\s*700;[^}]*white-space:\s*nowrap;/is
  );
});

test("Marketplace catalog does not present preview prices or mock sale history", async () => {
  const [tileSource, detailSource, homeSource, dataSource] = await Promise.all([
    readFile(new URL("../src/MarketplaceCardTile.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/MarketplaceDetailDialog.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/HomeDiscovery.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/marketplaceData.ts", import.meta.url), "utf8")
  ]);

  for (const source of [tileSource, detailSource, homeSource]) {
    assert.doesNotMatch(source, /formatUsd|fixedPrice|getMarketplaceSaleRange/);
  }
  assert.doesNotMatch(detailSource, /market-sales-history|market-detail-pricing|onBuy/);
  assert.doesNotMatch(dataSource, /marketplaceSales|saleMultipliers|MarketplaceSale/);
});

test("Marketplace cards show a zero FMV placeholder without restoring listing prices", async () => {
  const [tileSource, viewSource, dataSource] = await Promise.all([
    readFile(new URL("../src/MarketplaceCardTile.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/MarketplaceView.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/marketplaceData.ts", import.meta.url), "utf8")
  ]);

  assert.match(tileSource, /fmvLabel/);
  assert.match(tileSource, /item\.card\.fmv/);
  assert.match(viewSource, /fmvLabel=\{copy\.fmv\}/);
  assert.match(dataSource, /fmv: 0/);
  assert.doesNotMatch(tileSource, /fixedPrice|formatUsd/);
});

test("Marketplace uses rarity filters and an Iruka sort menu without a listing count", async () => {
  const [tileSource, viewSource, filterSource, sortMenuSource] = await Promise.all([
    readFile(new URL("../src/MarketplaceCardTile.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/MarketplaceView.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/marketplaceFilters.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/MarketplaceSortMenu.tsx", import.meta.url), "utf8").catch(() => "")
  ]);

  assert.doesNotMatch(tileSource, /getMarketplaceRarityLabel|market-rarity-badge/);
  assert.ok(filterSource.indexOf('key: "rarity"') < filterSource.indexOf('key: "member"'));
  assert.doesNotMatch(filterSource, /key: "price"/);
  assert.doesNotMatch(viewSource, /copy\.results|scrollToOwned|<Store/);
  assert.match(viewSource, /MarketplaceSortMenu/);
  assert.doesNotMatch(sortMenuSource, />\{label\}</);
  for (const option of ["price-asc", "price-desc", "fmv", "recent", "name"]) {
    assert.match(sortMenuSource, new RegExp(option));
  }
});

test("Marketplace preview uses all sixty-five supplied photocard images", async () => {
  const [dataSources, imageFiles] = await Promise.all([
    Promise.all([
      readFile(new URL("../src/marketplaceData.ts", import.meta.url), "utf8"),
      readFile(new URL("../src/marketplaceCatalog.ts", import.meta.url), "utf8").catch(() => "")
    ]),
    readdir(new URL("../src/assets/marketplace/", import.meta.url))
  ]);
  const dataSource = dataSources.join("\n");

  assert.match(dataSource, /group: "LE SSERAFIM"/);
  assert.match(dataSource, /group: "IVE"/);
  assert.match(dataSource, /group: "RESCENE"/);
  assert.match(dataSource, /group: "CORTIS"/);
  assert.match(dataSource, /group: "NCT 127"/);
  assert.match(dataSource, /group: "aespa"/);
  assert.match(dataSource, /group: "Hearts2Hearts"/);
  assert.match(dataSource, /group: "ILLIT"/);
  assert.match(dataSource, /group: "I-dle"/);
  assert.match(dataSource, /member: "Kazuha"/);
  assert.match(dataSource, /member: "Rei"/);
  assert.match(dataSource, /member: "Wonyoung"/);
  assert.match(dataSource, /member: "Woni"/);
  assert.match(dataSource, /member: "Minami"/);
  assert.match(dataSource, /member: "Zena"/);
  assert.match(dataSource, /member: "May"/);
  assert.doesNotMatch(dataSource, /member: "(?:Ari|Nari)"/);
  assert.deepEqual(
    imageFiles.sort(),
    [
      "aespa-giselle-lemonade.jpg",
      "aespa-karina-lemonade.jpg",
      "aespa-karina-savage.jpg",
      "aespa-karina-sprite.jpg",
      "aespa-winter-lemonade.jpg",
      "cortis-james-debut.jpg",
      "cortis-juhoon-debut.jpg",
      "cortis-keonho-debut.jpg",
      "cortis-martin-debut.jpg",
      "cortis-seonghyeon-debut.jpg",
      "hearts2hearts-a-na-dazed-korea.jpg",
      "hearts2hearts-carmen-dazed-korea.jpg",
      "hearts2hearts-dahyeon-dazed-korea.jpg",
      "hearts2hearts-ian-dazed-korea.jpg",
      "hearts2hearts-jiwoo-dazed-korea.jpg",
      "hearts2hearts-juun-dazed-korea.jpg",
      "hearts2hearts-ye-on-dazed-korea.jpg",
      "hearts2hearts-yuha-dazed-korea.jpg",
      "i-dle-minnie-2.jpg",
      "i-dle-miyeon-i-feel-1.jpg",
      "i-dle-miyeon-i-feel-2.jpg",
      "i-dle-shuhua-i-made.jpg",
      "i-dle-shuhua-i-never-die.jpg",
      "i-dle-shuhua-take-away.jpg",
      "i-dle-shuhua-we-are.jpg",
      "i-dle-soyeon-2.jpg",
      "i-dle-yuqi-crow.jpg",
      "i-dle-yuqi-i-sway.jpg",
      "illit-iroha-elle.jpg",
      "illit-minju-elle.jpg",
      "illit-moka-elle.jpg",
      "illit-wonhee-elle.jpg",
      "illit-yunah-elle.jpg",
      "ive-rei-accendio.jpg",
      "ive-wonyoung-amuse.jpg",
      "ive-wonyoung-puma.jpg",
      "le-sserafim-chaewon-pureflow-pt-1-1.jpg",
      "le-sserafim-chaewon-pureflow-pt-1-2.jpg",
      "le-sserafim-chaewon-spaghetti.jpg",
      "le-sserafim-eunchae-celebration.jpg",
      "le-sserafim-eunchae-spaghetti.jpg",
      "le-sserafim-kazuha-celebration.jpg",
      "le-sserafim-kazuha-crazy.jpg",
      "le-sserafim-kazuha-pureflow-pt-1.jpg",
      "le-sserafim-kazuha-vita500-zero.jpg",
      "le-sserafim-sakura-different.jpg",
      "le-sserafim-sakura-hot.jpg",
      "le-sserafim-sakura-pureflow-pt-1.jpg",
      "le-sserafim-yunjin-crazy.jpg",
      "le-sserafim-yunjin-pureflow-pt-1.jpg",
      "le-sserafim-yunjin-spaghetti-pt-1.jpg",
      "nct-127-doyoung-ay-yo.jpg",
      "nct-127-haechan-ay-yo.jpg",
      "nct-127-jaehyun-ay-yo.jpg",
      "nct-127-johnny-ay-yo.jpg",
      "nct-127-jungwoo-ay-yo.jpg",
      "nct-127-taeyong-ay-yo.jpg",
      "nct-127-yuta-ay-yo.jpg",
      "rescene-liv-pretty-girl.jpg",
      "rescene-may-pretty-girl.jpg",
      "rescene-minami-pretty-girl.jpg",
      "rescene-woni-makestar-pob.jpg",
      "rescene-woni-pluschat.jpg",
      "rescene-woni-pretty-girl.jpg",
      "rescene-zena-pretty-girl.jpg"
    ]
  );
});

test("Marketplace sorting supports price, FMV, recency, and name", async () => {
  const filters = await import("../src/marketplaceFilters.ts");
  const items = [
    { card: { fmv: 0, group: "B", title: "Beta" }, listing: { fixedPrice: 9, id: "beta", listedAt: "2026-01-01" } },
    { card: { fmv: 4, group: "A", title: "Alpha" }, listing: { fixedPrice: 15, id: "alpha", listedAt: "2026-02-01" } },
    { card: { fmv: 2, group: "C", title: "Gamma" }, listing: { fixedPrice: 3, id: "gamma", listedAt: "2025-12-01" } }
  ];

  assert.deepEqual(
    filters.sortMarketplaceCards(items, "price-asc").map((item) => item.listing.id),
    ["gamma", "beta", "alpha"]
  );
  assert.deepEqual(
    filters.sortMarketplaceCards(items, "price-desc").map((item) => item.listing.id),
    ["alpha", "beta", "gamma"]
  );
  assert.deepEqual(
    filters.sortMarketplaceCards(items, "fmv").map((item) => item.listing.id),
    ["alpha", "gamma", "beta"]
  );
  assert.deepEqual(
    filters.sortMarketplaceCards(items, "recent").map((item) => item.listing.id),
    ["alpha", "beta", "gamma"]
  );
  assert.deepEqual(
    filters.sortMarketplaceCards(items, "name").map((item) => item.listing.id),
    ["alpha", "beta", "gamma"]
  );
});

test("Marketplace details show known inventory metadata without invented grading data", async () => {
  const [detailSource, dataSource, catalogSource] = await Promise.all([
    readFile(new URL("../src/MarketplaceDetailDialog.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/marketplaceData.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/marketplaceCatalog.ts", import.meta.url), "utf8")
  ]);

  assert.match(detailSource, /copy\.release/);
  assert.match(detailSource, /item\.card\.releaseYear\s*\?/);
  assert.match(detailSource, /copy\.releaseYear/);
  assert.match(detailSource, /copy\.cardType/);
  assert.match(detailSource, /copy\.rarity/);
  assert.match(detailSource, /copy\.condition/);
  assert.match(detailSource, /copy\.serial/);
  assert.match(detailSource, /item\.inventory\.certificateId\s*\?/);
  assert.match(detailSource, /copy\.certificateId/);
  assert.match(
    catalogSource,
    /id: "ive-rei-accendio"[^}\n]*releaseYear: 2024/
  );
  assert.doesNotMatch(dataSource, /certificateId:\s*["'][^"']+["']/);
  assert.doesNotMatch(detailSource, /FMV|vaultedAt|grade/i);
});

test("Marketplace preview does not mark unverified supplied cards as vaulted", async () => {
  const [dataSource, tileSource, detailSource] = await Promise.all([
    readFile(new URL("../src/marketplaceData.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/MarketplaceCardTile.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/MarketplaceDetailDialog.tsx", import.meta.url), "utf8")
  ]);

  assert.match(dataSource, /custodyVerified: false/);
  assert.match(tileSource, /item\.inventory\.custodyVerified/);
  assert.match(detailSource, /item\.inventory\.custodyVerified/);
});
