import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const docsRoot = new URL("../docs/gitbook/", import.meta.url);
const docsConfig = JSON.parse(
  await readFile(new URL("docs.json", docsRoot), "utf8"),
);

const expectedNavigation = [
  {
    group: "Start Here",
    public: true,
    pages: [
      "overview",
      "project/why-fandom-collectibles",
      "project/how-it-works",
      "faq",
    ],
  },
  {
    group: "Product",
    public: true,
    pages: [
      "packs/pack-information",
      "product/grading-and-verification",
      "product/vault",
      "product/marketplace",
      "product/redemption-and-shipping",
    ],
  },
  {
    group: "Trust and Direction",
    public: true,
    pages: ["policies/ip-and-listing-policy", "roadmap"],
  },
  {
    group: "Technology",
    public: true,
    pages: ["technical/onchain-architecture", "technical/giwa-testnet", "technical/monad-testnet"],
  },
];

const navigationPages = expectedNavigation.flatMap(({ pages }) => pages);
const publicPages = [...navigationPages, "packs/pack-reveal"];

async function readDoc(path) {
  return readFile(new URL(`${path}.mdx`, docsRoot), "utf8");
}

test("uses the production documentation information architecture", () => {
  assert.deepEqual(docsConfig.navigation.groups, expectedNavigation);
});

test("the unlisted pack reveal reference is also publicly accessible", async () => {
  assert.match(await readDoc("packs/pack-reveal"), /^public: true$/m);
});

test("documentation chrome exposes one Iruka website action per region", () => {
  assert.equal(docsConfig.navbar.links, undefined);
  assert.deepEqual(docsConfig.navbar.primary, {
    type: "button",
    label: "Open Iruka",
    href: "https://playiruka.space",
  });
  assert.equal(docsConfig.footer.socials, undefined);

  const websiteLinks = docsConfig.footer.links
    .flatMap(({ items }) => items)
    .filter(({ href }) => href === "https://playiruka.space");

  assert.equal(websiteLinks.length, 1);
});

test("public docs permit search while retaining AI usage preferences", async () => {
  const robots = await readFile(new URL("robots.txt", docsRoot), "utf8").catch(
    () => "",
  );
  const robotsMetatag = docsConfig.seo?.metatags?.robots ?? "";

  assert.equal(robotsMetatag, "index, follow");
  assert.match(robots, /User-agent:\s*\*/i);
  assert.match(robots, /Content-Signal:\s*ai-train=no, search=yes, ai-input=no/i);
  assert.match(robots, /^Allow:\s*\/$/m);
  assert.doesNotMatch(robots, /^Disallow:\s*\/$/m);
  assert.doesNotMatch(robots, /ai-train=yes|ai-input=yes/i);
});

test("every navigation page and redirect destination exists", async () => {
  await Promise.all(
    navigationPages.map((page) => access(new URL(`${page}.mdx`, docsRoot))),
  );

  const routes = new Set(navigationPages.map((page) => `/${page}`));
  for (const redirect of docsConfig.redirects) {
    const destination = redirect.destination.split("#")[0];
    assert.ok(
      routes.has(destination),
      `${redirect.source} redirects to missing route ${destination}`,
    );
  }
});

test("every internal documentation link resolves to a navigation page", async () => {
  const routes = new Set(navigationPages.map((page) => `/${page}`));
  const docs = await Promise.all(navigationPages.map(readDoc));

  for (const [index, doc] of docs.entries()) {
    const links = doc.matchAll(/\[[^\]]+\]\((\/[^)]+)\)/g);
    for (const link of links) {
      const route = link[1].split("#")[0];
      assert.ok(
        routes.has(route),
        `${navigationPages[index]} links to missing route ${route}`,
      );
    }
  }
});

test("overview separates live, validation, and planned work", async () => {
  const overview = await readDoc("overview");

  assert.match(overview, /\bLive\b/);
  assert.match(overview, /\bIn validation\b/);
  assert.match(overview, /\bPlanned\b/);
  assert.match(overview, /GIWA Sepolia/i);
  assert.match(overview, /Keeper/i);
  assert.match(overview, /successful test pulls/i);
});

test("overview leads with the product before technical execution evidence", async () => {
  const overview = await readDoc("overview");
  const productVisionIndex = overview.indexOf("## Product Vision");
  const executionIndex = overview.indexOf("## Execution Evidence");

  assert.ok(productVisionIndex >= 0);
  assert.ok(executionIndex > productVisionIndex);
  assert.match(overview, /팬 컬렉터블/);
  assert.match(overview, /Who Iruka Is For/i);
  assert.match(
    overview,
    /Vending[\s\S]{0,160}Reveal[\s\S]{0,160}Vault[\s\S]{0,160}Marketplace[\s\S]{0,160}Redemption/i,
  );
  assert.match(overview, /verified physical inventory[\s\S]{0,240}licensed IP/i);
});

test("overview states Iruka's fandom collectible differentiation", async () => {
  const overview = await readDoc("overview");

  assert.match(
    overview,
    /Korea-first infrastructure for physical fandom collectibles/i,
  );
  assert.match(overview, /starting\s+with K-pop photocards/i);
  assert.match(overview, /Why K-pop First/i);
  assert.match(overview, /What Makes Iruka Different/i);
  assert.match(overview, /artist[\s\S]{0,120}member[\s\S]{0,120}release/i);
  assert.match(overview, /trot[\s\S]{0,160}cheerleader[\s\S]{0,160}sports/i);
  assert.doesNotMatch(
    overview,
    /Documentation:\s*\[docs\.playiruka\.space\]/i,
  );
});

test("fandom collectible thesis uses sourced demand signals without promising appreciation", async () => {
  const thesis = await readDoc("project/why-fandom-collectibles");

  assert.match(thesis, /## Why K-pop First/i);
  assert.match(thesis, /52\.7%/);
  assert.match(thesis, /96\.9%/);
  assert.match(thesis, /10%/);
  assert.match(thesis, /Korea Consumer Agency/i);
  assert.match(thesis, /Weverse/i);
  assert.match(thesis, /Korea Creative Content Agency/i);
  assert.match(thesis, /https:\/\/www\.kca\.go\.kr\//);
  assert.match(thesis, /https:\/\/en\.weverse\.co\/news\//);
  assert.match(thesis, /https:\/\/sns\.kocca\.kr\//);
  assert.match(
    thesis,
    /does not mean that every photocard appreciates|does not show that every photocard appreciates/i,
  );
  assert.match(thesis, /completed sales/i);
  assert.match(thesis, /K-pop[\s\S]{0,180}trot[\s\S]{0,180}cheerleader[\s\S]{0,180}sports/i);
});

test("product flow stays collector-first across the overview and product guide", async () => {
  const [overview, howItWorks] = await Promise.all([
    readDoc("overview"),
    readDoc("project/how-it-works"),
  ]);

  for (const doc of [overview, howItWorks]) {
    assert.match(
      doc,
      /Vending[\s\S]{0,220}Reveal[\s\S]{0,220}Vault[\s\S]{0,220}Marketplace[\s\S]{0,220}Redemption/i,
    );
  }

  assert.match(howItWorks, /## The Collector Journey/);
  assert.match(howItWorks, /## What Is Available Today/);
});

test("every product page uses the shared status taxonomy", async () => {
  const docs = await Promise.all(navigationPages.slice(1).map(readDoc));

  for (const doc of docs) {
    assert.match(doc, /> \*\*Status: (?:Live|In validation|Planned)/);
  }
});

test("pack odds match the committed Debut fixture", async () => {
  const odds = JSON.parse(
    await readFile(
      new URL("../scripts/giwa/debut-odds.json", import.meta.url),
      "utf8",
    ),
  );
  const packInformation = await readDoc("packs/pack-information");

  assert.equal(
    Object.values(odds).reduce((total, basisPoints) => total + basisPoints, 0),
    10_000,
  );

  for (const [rarity, basisPoints] of Object.entries(odds)) {
    assert.match(
      packInformation,
      new RegExp(`${rarity}[\\s\\S]{0,100}${basisPoints / 100}%`, "i"),
    );
  }

  assert.match(packInformation, /rarity is not a physical grade/i);
});

test("pack documentation defines the four-tier product model", async () => {
  const packInformation = await readDoc("packs/pack-information");

  assert.match(packInformation, /## Pack Model/);
  assert.match(packInformation, /category[\s\S]{0,100}tier/i);
  assert.match(packInformation, /K-pop[\s\S]{0,200}initial category/i);
  assert.match(packInformation, /Trot[\s\S]{0,200}Planned/i);
  assert.match(packInformation, /Cheerleader[\s\S]{0,200}Planned/i);
  assert.match(packInformation, /Sports[\s\S]{0,200}Planned/i);
  assert.match(packInformation, /Debut[\s\S]{0,180}entry/i);
  assert.match(packInformation, /Stage[\s\S]{0,180}balanced/i);
  assert.match(packInformation, /Encore[\s\S]{0,180}premium/i);
  assert.match(packInformation, /Grail[\s\S]{0,180}highest/i);
  assert.match(packInformation, /20 preview card identities/i);
  assert.match(packInformation, /100 committed test positions/i);
});

test("pack documentation defines fandom-native inventory metadata", async () => {
  const packInformation = await readDoc("packs/pack-information");

  assert.match(packInformation, /## Fandom Inventory Identity/i);
  for (const field of [
    "category",
    "artistOrTeam",
    "memberOrPlayer",
    "release",
    "eventOrBenefit",
    "cardType",
    "officialSource",
    "verificationTrack",
  ]) {
    assert.match(packInformation, new RegExp(`\\b${field}\\b`));
  }
});

test("pack reveal docs publish the vending dispense sequence", async () => {
  const [packReveal, sprint] = await Promise.all([
    readDoc("packs/pack-reveal"),
    readFile(new URL("../sprint.md", import.meta.url), "utf8")
  ]);

  for (const source of [packReveal, sprint]) {
    assert.doesNotMatch(source, /5\.04-second/i);
    assert.match(source, /72%/);
    assert.match(source, /220ms/);
    assert.match(
      source,
      /sealed\s*->\s*unpacking\s*->\s*summary/i
    );
    assert.match(source, /GSAP/i);
    assert.match(source, /without video|no video/i);
    assert.match(source, /single (?:pack|package|card surface)/i);
    assert.match(source, /every rarity|all rarities/i);
    assert.match(source, /Release[\s\S]{0,140}0\.0-0\.6s/i);
    assert.match(source, /Pack motion[\s\S]{0,140}0\.6-2\.0s/i);
    assert.match(source, /Opening[\s\S]{0,140}2\.0-3\.8s/i);
    assert.match(source, /Extracting[\s\S]{0,140}3\.5-6\.8s/i);
    assert.match(source, /Showcase[\s\S]{0,140}8\.7-9\.0s/i);
    assert.match(source, /centered pack/i);
    assert.doesNotMatch(source, /vending slot/i);
    assert.match(source, /one card surface/i);
    assert.match(source, /actual (?:pulled|inventory) (?:card|image)/i);
    assert.match(source, /pack and (?:the )?(?:pulled )?card remain[\s\S]{0,100}wash/i);
    assert.match(source, /no rotation/i);
    assert.match(source, /Edition[\s\S]{0,100}Summary/i);
    assert.match(source, /Serial[\s\S]{0,100}Summary/i);
    assert.match(source, /explicit Skip/i);
    assert.match(source, /300ms/);
    assert.doesNotMatch(source, /hint chips/i);
    assert.doesNotMatch(source, /idle\s*->\s*charging/i);
    assert.doesNotMatch(source, /7\.5 seconds/i);
  }

  assert.match(
    packReveal,
    /extracted card and Summary use the same original image URL/i
  );
});

test("grading policy documents both tracks and complete records", async () => {
  const grading = await readDoc("product/grading-and-verification");

  assert.match(grading, /Debut \/ Stage/);
  assert.match(grading, /Encore \/ Grail/);
  assert.match(grading, /Under evaluation/i);
  assert.match(grading, /https:\/\/break\.co\.kr\//);
  assert.match(grading, /https:\/\/www\.cgcgrading\.com\/en-US\/verify/);

  for (const field of [
    "inventoryId",
    "grader",
    "certificateNumber",
    "grade",
    "verificationUrl",
    "verificationStatus",
    "frontImage",
    "backImage",
    "verifiedAt",
    "custodyStatus",
    "redemptionEligible",
  ]) {
    assert.match(grading, new RegExp(`\\b${field}\\b`));
  }

  assert.match(grading, /does not establish a partnership/i);
  assert.match(grading, /professional grading is not required for every photocard/i);
  assert.match(grading, /cost[\s\S]{0,120}turnaround/i);
});

test("marketplace documents fandom identity and evidence-based value references", async () => {
  const marketplace = await readDoc("product/marketplace");

  assert.match(marketplace, /## Fandom Card Identity/i);
  assert.match(marketplace, /artist or team/i);
  assert.match(marketplace, /member or player/i);
  assert.match(marketplace, /release/i);
  assert.match(marketplace, /event or benefit/i);
  assert.match(marketplace, /## Estimated Value Method/i);
  assert.match(marketplace, /completed sales/i);
  assert.match(marketplace, /sample count/i);
  assert.match(marketplace, /asking prices/i);
  assert.match(marketplace, /does not publish an estimate/i);
});

test("onchain architecture states current boundaries", async () => {
  const architecture = await readDoc("technical/onchain-architecture");

  assert.match(architecture, /commit-reveal/i);
  assert.match(architecture, /not a VRF/i);
  assert.match(architecture, /does not mint ERC-721/i);
  assert.match(architecture, /does not settle USDC/i);
  assert.match(architecture, /Offchain/i);
  assert.match(architecture, /Iruka Wallet/i);
  assert.match(architecture, /Connected wallet/i);
  assert.match(architecture, /same-chain transfers/i);
  assert.match(architecture, /does not store[\s\S]{0,30}private key/i);
});

test("account docs separate the Iruka Wallet from optional external wallets", async () => {
  const [howItWorks, faq] = await Promise.all([
    readDoc("project/how-it-works"),
    readDoc("faq")
  ]);

  for (const doc of [howItWorks, faq]) {
    assert.match(doc, /user-controlled Iruka Wallet/i);
    assert.match(doc, /external wallet is\s+optional/i);
    assert.match(doc, /(?:GIWA Sepolia test ETH|test ETH on GIWA Sepolia)/i);
    assert.match(doc, /(?:Monad\s+Testnet MON|test MON on Monad\s+Testnet)/i);
  }
});

test("GIWA Contracts documents deployment and successful pull transactions", async () => {
  const giwaContracts = await readDoc("technical/giwa-testnet");
  const hashes = [
    "0xbf39aa26f3edb6fce45b151282d40dc83c643fcd348ecf5b68fdb5f6c8d6449d",
    "0xc569ee917a1b3664afbc8eb40ce6497dd60953bf11a799c894a37667cc24f258",
    "0x5ac3933f2b5db9ee0ceb73138bbf5b661a1edbd453a6e581f43b29fd80a80e78",
    "0xa01530136ffc040d476d9ac523ec103ec4a947050b6f86f7b20f0dad4841b71c",
    "0x11bcc9a0a4b61d38f1d8ee1fe722335983bc78a1a861b324dda799e3bf773c9e",
  ];

  for (const hash of hashes) {
    assert.match(giwaContracts, new RegExp(hash, "i"));
  }

  assert.match(giwaContracts, /title: "GIWA Contracts"/);
  assert.match(giwaContracts, /## Deployed Contract/);
  assert.match(giwaContracts, /## Pull Transactions/);
  assert.doesNotMatch(giwaContracts, /(?:Testnet|Deployment|Pull) Evidence/i);
  assert.doesNotMatch(giwaContracts, /Awaiting review pull/i);
});

test("Docs identify Debut as the only live pack and scheduled Keeper recovery", async () => {
  const [packInformation, giwaContracts] = await Promise.all([
    readDoc("packs/pack-information"),
    readDoc("technical/giwa-testnet")
  ]);

  assert.match(packInformation, /Debut is the only live testnet pack/i);
  assert.match(packInformation, /Stage, Encore, and Grail[\s\S]{0,80}Coming soon/i);
  assert.match(
    giwaContracts,
    /Vending panel displays[\s\S]{0,80}0\.00001[\s\S]{0,40}test ETH/i
  );
  assert.match(
    packInformation,
    /Vending panel displays[\s\S]{0,80}native test charge and available supply/i
  );
  assert.match(packInformation, /\| Test price \| `0\.00001` test ETH \| `0\.00001` test MON \|/);
  assert.doesNotMatch(packInformation, /displayed app price/i);
  assert.match(giwaContracts, /scheduled recovery/i);
  assert.match(giwaContracts, /once per minute/i);
});

test("roadmap includes gated category expansion", async () => {
  const roadmap = await readDoc("roadmap");

  assert.match(roadmap, /## Product Direction/);
  assert.match(roadmap, /## 1\. Iruka Vending/);
  assert.match(roadmap, /## 2\. Licensed IP Drops/);
  assert.match(roadmap, /## 3\. Creator Playground/);
  assert.match(roadmap, /## 4\. The Iruka Universe/);
  assert.match(roadmap, /Category Expansion Track/);
  assert.match(roadmap, /K-pop/i);
  assert.match(roadmap, /trot/i);
  assert.match(roadmap, /cheerleader/i);
  assert.match(roadmap, /sports (?:player|athlete)/i);
  assert.match(roadmap, /rights holder/i);
  assert.match(roadmap, /same (?:physical )?(?:collectible )?infrastructure/i);
});

test("FAQ explains the K-pop wedge, value limits, grading, and category expansion", async () => {
  const faq = await readDoc("faq");

  assert.match(faq, /Why Does Iruka Start With K-pop/i);
  assert.match(faq, /Do All Photocards Gain Value/i);
  assert.match(faq, /Does Every Card Need Professional Grading/i);
  assert.match(faq, /How Does Iruka Expand Beyond K-pop/i);
  assert.match(faq, /trot/i);
  assert.match(faq, /cheerleader/i);
  assert.match(faq, /sports/i);
});

test("Technology is the final documentation group", () => {
  assert.equal(
    expectedNavigation.at(-1)?.group,
    "Technology",
  );
});

test("the repository links to GIWA Contracts without legacy evidence wording", async () => {
  const readme = await readFile(new URL("../README.md", import.meta.url), "utf8");

  assert.match(readme, /\[GIWA Contracts\]/);
  assert.match(readme, /committed server-seed proof/i);
  assert.doesNotMatch(readme, /GIWA Testnet Evidence/i);
  assert.doesNotMatch(readme, /client-seed reveal/i);
});

test("public docs avoid competitor names and unsupported promises", async () => {
  const docs = await Promise.all(publicPages.map(readDoc));
  const corpus = docs.join("\n");

  assert.doesNotMatch(corpus, /\b(?:Phygitals|Beezie|Courtyard)\b/i);
  assert.doesNotMatch(corpus, /\b(?:insured vault|guaranteed buyback)\b/i);
  assert.doesNotMatch(corpus, /\b0%\s+(?:platform\s+)?fee/i);
  assert.doesNotMatch(corpus, /dispatch(?:es)? within five business days/i);
  assert.doesNotMatch(corpus, /\bgas (?:is )?sponsored\b/i);
  assert.doesNotMatch(
    corpus,
    /\b(?:official partner|in partnership|partnered with)\b/i,
  );
});
