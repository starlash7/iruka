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
    pages: ["overview", "project/how-it-works", "faq"],
  },
  {
    group: "Collecting",
    pages: [
      "packs/pack-information",
      "product/grading-and-verification",
      "product/vault",
      "product/marketplace",
      "product/redemption-and-shipping",
    ],
  },
  {
    group: "Technology",
    pages: ["technical/onchain-architecture", "technical/giwa-testnet"],
  },
  {
    group: "Trust and Direction",
    pages: ["policies/ip-and-listing-policy", "roadmap"],
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
    assert.match(doc, /GIWA Sepolia test ETH/i);
  }
});

test("GIWA Contracts documents deployment and successful pull transactions", async () => {
  const giwaContracts = await readDoc("technical/giwa-testnet");
  const hashes = [
    "0x4118014dc390ab03e0843c90ffdae3c0bd029472b6aa7407d0e9c085fe74176d",
    "0xbbab1fc046f01a7f82eb7ce99f61daba88decf63d0766ae3d42af06f5367c4de",
    "0xde7e40e97cd6c1631f2f490a5707457308ea5d56bbe8114f21646912c1bf7b0b",
    "0x8a0da6b397518ec64bbe4e16cb053fe6f9af6e8e9d92220f78f646e28791f79c",
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
  assert.match(giwaContracts, /scheduled recovery/i);
  assert.match(giwaContracts, /once per minute/i);
});

test("roadmap includes gated category expansion", async () => {
  const roadmap = await readDoc("roadmap");

  assert.match(roadmap, /Category Expansion Track/);
  assert.match(roadmap, /K-pop/i);
  assert.match(roadmap, /trot/i);
  assert.match(roadmap, /cheerleader/i);
  assert.match(roadmap, /sports (?:player|athlete)/i);
  assert.match(roadmap, /rights holder/i);
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
