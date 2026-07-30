import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { after, before, test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

let server;
let createRevealCard;
let createVendingCardPull;
let formatCardPullValue;
let getPackInventory;
let appCopy;
let packDetails;
let VendingPackDetail;
let VendingPackInventory;
let VendingRarityFilters;
let VendingPackRail;
let VendingView;

before(async () => {
  server = await createServer({
    appType: "custom",
    optimizeDeps: { noDiscovery: true },
    server: { hmr: false, middlewareMode: true }
  });
  ({ createRevealCard, createVendingCardPull, formatCardPullValue } = await server.ssrLoadModule("/src/cardFlow.tsx"));
  ({ copy: appCopy } = await server.ssrLoadModule("/src/appCopy.ts"));
  ({ getPackInventory, packDetails } = await server.ssrLoadModule("/src/vendingData.ts"));
  ({ VendingPackDetail } = await server.ssrLoadModule("/src/VendingPackDetail.tsx"));
  ({ VendingPackInventory, VendingRarityFilters } = await server.ssrLoadModule("/src/VendingPackInventory.tsx"));
  ({ VendingPackRail } = await server.ssrLoadModule("/src/VendingPackRail.tsx"));
  ({ VendingView } = await server.ssrLoadModule("/src/VendingView.tsx"));
});

after(async () => {
  await server?.close();
});

const packDetailCopy = {
  batch: "Batch",
  category: "Girl Groups",
  comingSoon: "Coming soon",
  openPack: "Pull 1 pack",
  opening: "Opening pack",
  packLabel: "Pack",
  packOdds: "Pack odds",
  physicalRedemption: "Physical redemption",
  redemptionUnavailable: "Redemption unavailable",
  resumeOpening: "Resume opening",
  viewOdds: "View odds & values"
};
const rarityLabels = {
  Common: "Common",
  Rare: "Rare",
  Epic: "Epic",
  Legendary: "Legendary",
  Iruka: "Iruka"
};
const statusLabels = {
  live: "Live",
  "low-stock": "Low stock",
  "sold-out": "Sold out",
  "coming-soon": "Coming soon"
};

test("Vending reveal cards retain their USDC display value", () => {
  const card = createRevealCard({
    estimatedValue: 29,
    group: "Debut",
    member: "Collectible 01",
    rarity: "Rare",
    serial: "IRK-0001"
  }, "Rare", "29.00 USDC");

  assert.equal(card.valueLabel, "29.00 USDC");
  assert.match(decodeURIComponent(card.imageUrl), /29\.00 USDC/);
});

test("Vending reveal cards prefer the selected inventory image", () => {
  const imageUrl = "/assets/pull-cards/card-01.jpg";
  const card = createRevealCard({
    estimatedValue: 29,
    group: "Debut",
    imageUrl,
    member: "fromis_9 · Hayoung",
    rarity: "Rare",
    serial: "IRK-0001"
  }, "Rare", "29.00 USDC");

  assert.equal(card.imageUrl, imageUrl);
});

test("Vending catalog shows the twenty vaulted card images once", async () => {
  const inventory = await getPackInventory("debut", { catalog: true, limit: 24 });
  const images = inventory.items.map((card) => card.media.frontUrl);

  assert.equal(inventory.total, 20);
  assert.equal(new Set(images).size, 20);
  assert.equal(images[0], "/assets/pull-cards/card-01.jpg");
  assert.equal(images[19], "/assets/pull-cards/card-20.jpg");
  assert.equal(inventory.items[0].title, "fromis_9 · Hayoung");
});

test("Vending pull card assets are present in the public bundle", async () => {
  const assets = await Promise.all(
    Array.from({ length: 20 }, (_, index) =>
      readFile(new URL(
        `../public/assets/pull-cards/card-${String(index + 1).padStart(2, "0")}.jpg`,
        import.meta.url
      ))
    )
  );

  assert.equal(assets.length, 20);
  assert.ok(assets.every((asset) => asset.byteLength > 100_000));
});

test("Vending API pulls preserve the selected inventory card and USDC range", () => {
  const inventoryCard = packDetails[0].featuredInventory[1];
  const card = createVendingCardPull({
    card: inventoryCard,
    id: "debut-pull-1",
    packId: "debut",
    pulledAt: "2026-07-16T00:00:00.000Z"
  }, "Debut");

  assert.equal(card.id, "debut-pull-1");
  assert.equal(card.member, inventoryCard.title);
  assert.equal(card.rarity, inventoryCard.tier);
  assert.equal(card.imageUrl, inventoryCard.media.frontUrl);
  assert.deepEqual(card.estimatedValueRangeUsdc, inventoryCard.estimatedValueRangeUsdc);
  assert.equal(formatCardPullValue(card), "21.00 – 57.00 USDC");
  assert.equal(card.vaultStatus, "Pulled");
});

test("Vending pull records use the active locale's pack label", () => {
  const inventoryCard = packDetails[0].featuredInventory[0];
  const card = createVendingCardPull({
    card: inventoryCard,
    id: "debut-pull-ko",
    packId: "debut",
    pulledAt: "2026-07-16T00:00:00.000Z"
  }, "Debut", "팩");

  assert.equal(card.group, "Debut 팩");
});

test("pack rail exposes four icon tabs without repeated prices or statuses", () => {
  const markup = renderToStaticMarkup(
    React.createElement(VendingPackRail, {
      onSelectPack: () => undefined,
      packs: packDetails,
      selectedPackId: "debut"
    })
  );

  assert.equal((markup.match(/aria-pressed=/g) ?? []).length, 4);
  assert.equal((markup.match(/class="vending-tier-media"/g) ?? []).length, 4);
  assert.match(markup, /Debut/);
  assert.match(markup, /Grail/);
  assert.doesNotMatch(markup, /USDC|Live|Coming soon|Low stock|Sold out/);
});

test("only the Debut pack exposes the live pull action", () => {
  const markup = renderToStaticMarkup(
    React.createElement(VendingPackDetail, {
      copy: packDetailCopy,
      isOpening: false,
      onOpenPack: () => undefined,
      pack: packDetails[1],
      pullDisabled: true,
      rarityLabels,
      walletRequired: false
    })
  );

  assert.match(markup, /<button[^>]*disabled[^>]*>[\s\S]*?Coming soon[\s\S]*?<\/button>/);
  assert.doesNotMatch(markup, />Pull 1 pack</);
});

test("pack pull CTA does not repeat the price shown in the purchase panel", () => {
  const markup = renderToStaticMarkup(
    React.createElement(VendingPackDetail, {
      copy: packDetailCopy,
      isOpening: false,
      onOpenPack: () => undefined,
      pack: packDetails[0],
      rarityLabels,
      walletRequired: false
    })
  );

  assert.match(markup, />Pull 1 pack</);
  assert.doesNotMatch(markup, /Pull 1 pack · 19\.00 USDC/);
});

test("the live GIWA pack shows the test ETH charge approved by the wallet", () => {
  const markup = renderToStaticMarkup(
    React.createElement(VendingPackDetail, {
      copy: packDetailCopy,
      isOpening: false,
      onOpenPack: () => undefined,
      pack: packDetails[0],
      rarityLabels,
      testnetConfigured: true,
      testnetPriceWei: 10_000_000_000_000n,
      walletRequired: false
    })
  );

  assert.match(markup, /0\.00001 test ETH/);
  assert.doesNotMatch(markup, /19\.00 USDC/);
});

test("a configured GIWA pack never flashes the planned USDC price", () => {
  const markup = renderToStaticMarkup(
    React.createElement(VendingPackDetail, {
      copy: packDetailCopy,
      isOpening: false,
      onOpenPack: () => undefined,
      pack: packDetails[0],
      rarityLabels,
      testnetConfigured: true,
      walletRequired: false
    })
  );

  assert.match(markup, /— test ETH/);
  assert.doesNotMatch(markup, /19\.00 USDC/);
});

test("pack rail uses tier-colored packs cropped from the vending machines", () => {
  const markup = renderToStaticMarkup(
    React.createElement(VendingPackRail, {
      onSelectPack: () => undefined,
      packs: packDetails,
      selectedPackId: "debut"
    })
  );

  for (const packId of ["debut", "stage", "encore", "grail"]) {
    assert.match(markup, new RegExp(`iruka-pack-rail-${packId}\\.png`));
  }
  assert.doesNotMatch(markup, /iruka-pack-(debut|stage|encore|grail)\\.webp/);
});

test("the Stage rail icon clips the adjacent vending bay", async () => {
  const stylesheet = await readFile(
    new URL("../src/vending-layout.css", import.meta.url),
    "utf8"
  );

  assert.match(
    stylesheet,
    /\.vending-tier-option\[data-tier="stage"\] \.vending-tier-media img\s*\{[^}]*clip-path:\s*inset\(0 4px 0 0\);/s
  );
});

test("entering Vending does not scroll to the machine detail", async () => {
  const [appSource, chromeSource] = await Promise.all([
    readFile(new URL("../src/App.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/AppChrome.tsx", import.meta.url), "utf8")
  ]);

  assert.doesNotMatch(
    appSource,
    /document\.getElementById\("drops"\)\?\.scrollIntoView\(/
  );
  assert.doesNotMatch(appSource, /showView\("pull", "drops"\)/);
  assert.doesNotMatch(chromeSource, /onShowView\("pull", "drops"\)/);
});

test("home CTA uses a subtle action beam over the primary button surface", async () => {
  const [homeSource, stylesheet] = await Promise.all([
    readFile(new URL("../src/HomeView.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/styles.css", import.meta.url), "utf8")
  ]);

  assert.match(homeSource, /<IrukaBeam className="home-primary-beam" variant="action">/);
  assert.doesNotMatch(homeSource, /ArrowRight/);
  assert.match(homeSource, /className="iruka-action-button home-primary-action"/);
  assert.match(stylesheet, /\.home-primary-action/);
});

test("post-pull actions use one primary and two secondary Iruka roles", async () => {
  const [source, stylesheet] = await Promise.all([
    readFile(new URL("../src/App.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/styles.css", import.meta.url), "utf8")
  ]);

  assert.match(
    source,
    /className="iruka-action-button asset-action-primary"[\s\S]*?t\.actions\.vault/
  );
  assert.equal(
    (source.match(/className="asset-action-secondary iruka-secondary-button"/g) ?? []).length,
    2
  );
  assert.match(
    source,
    /className="asset-action-secondary iruka-secondary-button"[\s\S]*?t\.actions\.sellNow/
  );
  assert.match(
    source,
    /className="asset-action-secondary iruka-secondary-button"[\s\S]*?t\.actions\.ship/
  );
  assert.match(
    stylesheet,
    /\.asset-actions button \{[^}]*min-height:\s*48px;[^}]*border-radius:\s*var\(--radius-pill\);/is
  );
  assert.match(stylesheet, /\.asset-actions \.asset-action-primary\s*\{/);
  assert.match(stylesheet, /\.asset-actions \.asset-action-secondary\s*\{/);
  assert.match(stylesheet, /\.asset-actions \.asset-action-secondary:disabled\s*\{/);
});

test("Vending keeps the purchase beam while tier tabs remain borderless", async () => {
  const [detailSource, railSource, stylesheet, layoutStylesheet, purchaseStylesheet, responsiveStylesheet] = await Promise.all([
    readFile(new URL("../src/VendingPackDetail.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/VendingPackRail.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/styles.css", import.meta.url), "utf8"),
    readFile(new URL("../src/vending-layout.css", import.meta.url), "utf8"),
    readFile(new URL("../src/vending-purchase.css", import.meta.url), "utf8"),
    readFile(new URL("../src/vending-responsive.css", import.meta.url), "utf8")
  ]);

  assert.match(
    detailSource,
    /<IrukaBeam active=\{!isOpening && !pullDisabled\} className="vending-primary-beam" variant="action">/
  );
  assert.match(detailSource, /className="iruka-action-button vending-primary-action"/);
  assert.doesNotMatch(railSource, /IrukaBeam|formatUsdc|statusLabels/);
  assert.match(layoutStylesheet, /\.vending-tier-option\s*\{[^}]*border:\s*0;/is);
  assert.match(layoutStylesheet, /\.vending-tier-option\.is-selected\s*\{[^}]*background:/is);
  assert.match(stylesheet, /\.vending-primary-beam \{[\s\S]*?margin-top: 20px;/);
  assert.match(
    purchaseStylesheet,
    /\.vending-primary-action\s*\{[^}]*font-family:\s*var\(--font-sans\);/is
  );
  assert.doesNotMatch(purchaseStylesheet, /font-family:\s*Arial/);
  assert.doesNotMatch(purchaseStylesheet, /\.vending-primary-action \{[\s\S]*?margin-top: 20px;/);
  assert.doesNotMatch(stylesheet, /\.vending-pack-beam\[data-active\]/);
  assert.doesNotMatch(responsiveStylesheet, /\.vending-primary-action\s*\{[^}]*position:\s*sticky/);
});

test("tier packs keep the product art clean inside the selected machine", () => {
  const railMarkup = renderToStaticMarkup(
    React.createElement(VendingPackRail, {
      onSelectPack: () => undefined,
      packs: packDetails,
      selectedPackId: "debut"
    })
  );
  const detailMarkup = renderToStaticMarkup(
    React.createElement(VendingPackDetail, {
      copy: packDetailCopy,
      isOpening: false,
      onOpenPack: () => undefined,
      pack: packDetails[1],
      rarityLabels,
      walletRequired: false
    })
  );

  assert.match(railMarkup, /data-tier="debut"/);
  assert.match(railMarkup, /data-tier="stage"/);
  assert.match(railMarkup, /data-tier="encore"/);
  assert.match(railMarkup, /data-tier="grail"/);
  assert.equal((railMarkup.match(/vending-pack-identity-band/g) ?? []).length, 0);
  assert.equal((detailMarkup.match(/vending-pack-identity-band/g) ?? []).length, 0);
  assert.equal((detailMarkup.match(/vending-machine-pack-art/g) ?? []).length, 0);
  assert.equal((detailMarkup.match(/data-tier="stage"/g) ?? []).length, 1);
  assert.equal((detailMarkup.match(/class="vending-machine-pack"/g) ?? []).length, 0);
  assert.doesNotMatch(detailMarkup, /iruka-pack-stage\.webp/);
});

test("machine art stays unfiltered without a duplicate pack layer", async () => {
  const markup = renderToStaticMarkup(
    React.createElement(VendingPackDetail, {
      copy: packDetailCopy,
      isOpening: false,
      onOpenPack: () => undefined,
      pack: packDetails[0],
      rarityLabels,
      walletRequired: false
    })
  );
  const stylesheet = await readFile(new URL("../src/vending-layout.css", import.meta.url), "utf8");

  assert.doesNotMatch(markup, /vending-machine-stock|vending-machine-pack|iruka-pack-debut\.webp/);
  assert.doesNotMatch(markup, /iruka-wordmark\.png/);
  assert.doesNotMatch(stylesheet, /\.vending-detail-media::before|\.vending-detail-media::after/);
  assert.doesNotMatch(stylesheet, /vendingPackSwap|vending-machine-stock|vending-machine-pack/);
});

test("odds use bright Iruka rarity colors", async () => {
  const stylesheet = await readFile(new URL("../src/vending-odds.css", import.meta.url), "utf8");

  assert.match(stylesheet, /\.vending-odds-row\.rarity-rare\s*\{\s*--odds-accent: #12b76a;/);
  assert.match(stylesheet, /\.vending-odds-row\.rarity-epic\s*\{\s*--odds-accent: #f04438;/);
  assert.match(stylesheet, /\.vending-odds-row\.rarity-legendary\s*\{\s*--odds-accent: #f79009;/);
  assert.match(stylesheet, /\.vending-odds-row\.rarity-iruka\s*\{\s*--odds-accent: #1677ff;/);
});

test("each tier renders its matching vending machine base", () => {
  const expectedMachineImages = [
    [packDetails[0], "iruka-vending-machine-debut.png"],
    [packDetails[1], "iruka-vending-machine-stage.png"],
    [packDetails[2], "iruka-vending-machine-encore.png"],
    [packDetails[3], "iruka-vending-machine-grail.png"]
  ];

  for (const [pack, imageName] of expectedMachineImages) {
    const markup = renderToStaticMarkup(React.createElement(VendingPackDetail, {
      copy: packDetailCopy,
      isOpening: false,
      onOpenPack: () => undefined,
      pack,
      rarityLabels,
      walletRequired: false
    }));

    assert.match(markup, new RegExp(imageName.replace(".", "\\.")));
    assert.doesNotMatch(markup, /vending-machine-stock|iruka-pack-(debut|stage|encore|grail)\.webp/);
  }
});

test("machine bases use one normalized square frame", async () => {
  const stylesheet = await readFile(new URL("../src/vending-layout.css", import.meta.url), "utf8");

  assert.match(
    stylesheet,
    /\.vending-machine-base\s*\{[\s\S]*?width: 100%;[\s\S]*?height: 100%;[\s\S]*?object-fit: fill;/
  );
  assert.doesNotMatch(stylesheet, /\.vending-detail-media\[data-tier=/);
});

test("pack detail keeps direct rarity odds without estimated values", () => {
  const pack = packDetails[0];
  const markup = renderToStaticMarkup(
    React.createElement(VendingPackDetail, {
      copy: packDetailCopy,
      isOpening: false,
      onOpenPack: () => undefined,
      pack,
      rarityLabels,
      walletRequired: false
    })
  );

  assert.equal((markup.match(/class="vending-machine-pack"/g) ?? []).length, 0);
  assert.match(markup, /IRK-GG-2026-001/);
  assert.match(markup, />Pull 1 pack</);
  assert.match(markup, /Redemption unavailable/);
  assert.doesNotMatch(markup, />Physical redemption</);
  assert.doesNotMatch(markup, /Live|Low stock|Sold out|Coming soon|Remaining|Pack supply sold/);
  assert.doesNotMatch(markup, /vending-supply-meter/);
  assert.equal((markup.match(/class="vending-odds-tile/g) ?? []).length, 0);
  assert.doesNotMatch(markup, /class="vending-odds-grid"/);
  assert.equal((markup.match(/class="vending-odds-meta/g) ?? []).length, 0);
  assert.doesNotMatch(markup, /vending-odds-disclosure|View odds &amp; values/);
  assert.equal((markup.match(/class="vending-odds-row rarity-/g) ?? []).length, 5);
  assert.equal((markup.match(/class="vending-odds-card/g) ?? []).length, 0);
  assert.doesNotMatch(markup, /72 cards/);
  assert.doesNotMatch(markup, /6\.00 – 18\.00 USDC/);
  assert.doesNotMatch(markup, /21\.00 – 57\.00 USDC/);
  assert.match(markup, /rarity-common/);
  assert.match(markup, /rarity-iruka/);
  assert.doesNotMatch(markup, /vending-odds-bar|vending-odds-legend/);
  assert.doesNotMatch(markup, /Buyback|Turbo|expected return/i);
});

test("future tiers remain browsable without exposing a pull action", () => {
  for (const pack of packDetails.slice(1)) {
    const markup = renderToStaticMarkup(React.createElement(VendingPackDetail, {
      copy: packDetailCopy,
      isOpening: false,
      onOpenPack: () => undefined,
      pack,
      pullDisabled: true,
      rarityLabels,
      walletRequired: false
    }));

    assert.match(markup, /class="iruka-action-button vending-primary-action" disabled=""/);
    assert.match(markup, />Coming soon</);
    assert.doesNotMatch(markup, />Pull 1 pack</);
  }
});

test("configured onchain packs keep the production pull label", () => {
  const pack = packDetails[0];
  const markup = renderToStaticMarkup(
    React.createElement(VendingPackDetail, {
      copy: {
        ...packDetailCopy,
        giwaTestnet: "GIWA Sepolia",
        testPull: "Test pull"
      },
      isOpening: false,
      onOpenPack: () => undefined,
      pack,
      rarityLabels,
      testnetEnabled: true,
      walletRequired: false
    })
  );

  assert.match(markup, /GIWA Sepolia/);
  assert.match(markup, />Pull 1 pack</);
  assert.doesNotMatch(markup, /Test pull/);
  assert.doesNotMatch(markup, /Pull 1 pack · 19\.00 USDC/);
});

test("a pending onchain pull stays in the product opening flow", () => {
  const waitingMarkup = renderToStaticMarkup(
    React.createElement(VendingPackDetail, {
      copy: { ...packDetailCopy, checkResult: "Check result", waitingResult: "Waiting for result" },
      isAwaitingFulfillment: true,
      isOpening: true,
      onOpenPack: () => undefined,
      pack: packDetails[0],
      rarityLabels,
      testnetEnabled: true,
      walletRequired: false
    })
  );
  const retryMarkup = renderToStaticMarkup(
    React.createElement(VendingPackDetail, {
      copy: { ...packDetailCopy, checkResult: "Check result", waitingResult: "Waiting for result" },
      isAwaitingFulfillment: true,
      isOpening: false,
      onOpenPack: () => undefined,
      pack: packDetails[0],
      rarityLabels,
      testnetEnabled: true,
      walletRequired: false
    })
  );

  assert.match(waitingMarkup, />Opening pack</);
  assert.match(retryMarkup, />Resume opening</);
  assert.doesNotMatch(`${waitingMarkup}${retryMarkup}`, /Check result|Waiting for result/);
});

test("Vending copy avoids test and verification language in the pull flow", () => {
  assert.equal(appCopy.en.vending.openPack, "Pull a pack");
  assert.equal(appCopy.en.vending.resumeOpening, "Resume opening");
  assert.equal(appCopy.en.vending.giwaTestnet, "GIWA Sepolia");
  assert.equal(appCopy.en.vending.giwaReceipt, "Pull receipt");
  assert.equal(appCopy.en.feedback.giwaPullPending, "Opening is taking longer than usual.");
  assert.doesNotMatch(
    JSON.stringify({
      vending: appCopy.en.vending,
      feedback: {
        giwaPullFailed: appCopy.en.feedback.giwaPullFailed,
        giwaPullPending: appCopy.en.feedback.giwaPullPending,
        giwaResultFailed: appCopy.en.feedback.giwaResultFailed
      }
    }),
    /Test pull|Check result|Waiting for result|could not be verified/
  );
});

test("pack detail localizes the pack suffix and rarity labels", () => {
  const markup = renderToStaticMarkup(React.createElement(VendingPackDetail, {
    copy: { ...packDetailCopy, packLabel: "팩" },
    isOpening: false,
    onOpenPack: () => undefined,
    pack: packDetails[0],
    rarityLabels: { ...rarityLabels, Common: "일반", Rare: "레어" },
    walletRequired: false
  }));

  assert.match(markup, /Debut 팩/);
  assert.match(markup, /일반/);
  assert.match(markup, /레어/);
});

test("inventory starts with eight featured cards and an explicit full-list action", () => {
  const pack = packDetails[0];
  const markup = renderToStaticMarkup(
    React.createElement(VendingPackInventory, {
      copy: {
        allRarities: "All rarities",
        estimatedValue: "Est. value",
        individualOdds: "Individual odds",
        insidePack: "Inside this pack",
        loadMore: "Load more",
        redeemable: "Redeemable",
        showFeatured: "Show featured",
        viewAllCards: "View all cards",
        viewBack: "View back",
        viewFront: "View front"
      },
      pack,
      rarityLabels: {
        Common: "Common",
        Rare: "Rare",
        Epic: "Epic",
        Legendary: "Legendary",
        Iruka: "Iruka"
      }
    })
  );

  assert.match(markup, /Inside this pack/);
  assert.match(markup, /View all cards/);
  assert.doesNotMatch(markup, /Individual odds|1\.00%/);
  assert.doesNotMatch(markup, /Est\. value|6\.00 – 18\.00 USDC|21\.00 – 57\.00 USDC/);
  assert.equal((markup.match(/class="vending-rarity-filter"/g) ?? []).length, 6);
  assert.doesNotMatch(markup, /vending-card-flip/);
  assert.equal((markup.match(/class="vending-inventory-card/g) ?? []).length, 8);
});

test("inventory rarity filters use hoverable pill buttons", async () => {
  assert.equal(typeof VendingRarityFilters, "function");

  const markup = renderToStaticMarkup(React.createElement(VendingRarityFilters, {
    allLabel: "All rarities",
    filter: "Rare",
    onSelect: () => undefined,
    rarityLabels
  }));
  const stylesheet = await readFile(new URL("../src/vending-inventory.css", import.meta.url), "utf8");

  assert.equal((markup.match(/type="button"/g) ?? []).length, 6);
  assert.equal((markup.match(/aria-pressed=/g) ?? []).length, 6);
  assert.match(markup, /aria-pressed="true"[^>]*>Rare</);
  assert.doesNotMatch(markup, /<select|<option/);
  assert.match(stylesheet, /\.vending-rarity-filter:hover/);
  assert.match(stylesheet, /\.vending-rarity-filter\[aria-pressed="true"\]/);
});

test("inventory card rarity renders as a hoverable pill", async () => {
  const pack = packDetails[0];
  const markup = renderToStaticMarkup(
    React.createElement(VendingPackInventory, {
      copy: {
        allRarities: "All rarities",
        insidePack: "Inside this pack",
        loadMore: "Load more",
        redeemable: "Redeemable",
        showFeatured: "Show featured",
        viewAllCards: "View all cards",
        viewBack: "View back",
        viewFront: "View front"
      },
      pack,
      rarityLabels
    })
  );
  const stylesheet = await readFile(new URL("../src/vending-inventory.css", import.meta.url), "utf8");

  assert.match(markup, /class="vending-card-rarity rarity-[a-z]+"/);
  assert.match(stylesheet, /\.vending-card-rarity\s*\{/);
  assert.match(stylesheet, /\.vending-card-rarity:hover/);
});

test("recent pulls render only from the explicit Vending session list", () => {
  const pack = packDetails[0];
  const props = {
    copy: {
      category: "Girl Groups",
      hero: {
        openPack: "Pull a pack", opening: "Opening pack",
        packLabel: "Pack", resumeOpening: "Resume opening"
      },
      inventory: {
        allRarities: "All rarities", estimatedValue: "Est. value", individualOdds: "Individual odds",
        insidePack: "Inside this pack", loadError: "Load error", loadMore: "Load more", redeemable: "Redeemable",
        showFeatured: "Show featured", viewAllCards: "View all cards", viewBack: "View back", viewFront: "View front"
      },
      labels: {
        batch: "Batch", cards: "cards", packOdds: "Pack odds",
        physicalRedemption: "Physical redemption", recentPulls: "Recent pulls",
        redemptionUnavailable: "Redemption unavailable",
        viewOdds: "View odds & values", yourPull: "Your pull"
      },
      rarities: { Common: "Common", Rare: "Rare", Epic: "Epic", Legendary: "Legendary", Iruka: "Iruka" },
      statusLabels
    },
    getCardImageUrl: () => "card.webp",
    isOpening: false,
    onOpenPack: () => undefined,
    onSelectPack: () => undefined,
    packs: packDetails,
    pullActions: null,
    pullCard: null,
    recentPulls: [],
    resultRef: { current: null },
    selectedPack: pack,
    walletRequired: false
  };
  const emptyMarkup = renderToStaticMarkup(React.createElement(VendingView, props));
  const pullMarkup = renderToStaticMarkup(React.createElement(VendingView, {
    ...props,
    recentPulls: [{
      estimatedValue: 29, group: "Debut", id: "session-pull", member: "Collectible 01",
      packId: "debut", pulledAt: "12:00", rarity: "Rare", serial: "IRK-0001"
    }]
  }));

  assert.doesNotMatch(emptyMarkup, /Recent pulls/);
  assert.match(pullMarkup, /Recent pulls/);
  assert.match(pullMarkup, /Collectible 01/);
});
