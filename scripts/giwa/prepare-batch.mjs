import { randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import {
  concatHex,
  encodeAbiParameters,
  keccak256,
  stringToHex
} from "viem";

const [batchLabel, totalSupplyInput, priceWei, oddsPath, outputPath, packId] =
  process.argv.slice(2);
const totalSupply = Number(totalSupplyInput);

if (
  !batchLabel
  || !Number.isSafeInteger(totalSupply)
  || totalSupply < 2
  || !priceWei
  || !oddsPath
  || !outputPath
  || !packId
) {
  throw new Error(
    "Usage: node scripts/giwa/prepare-batch.mjs <batch-label> <total-supply> <price-wei> <odds-json> <output-json> <pack-id>"
  );
}

BigInt(priceWei);
const odds = JSON.parse(await readFile(oddsPath, "utf8"));
const batchId = keccak256(stringToHex(batchLabel));
const inventory = Array.from({ length: totalSupply }, (_, index) => {
  const id = `${packId}-inventory-${String(index + 1).padStart(3, "0")}`;
  return { id, index, inventoryId: keccak256(stringToHex(id)) };
});
const leaves = inventory.map(({ index, inventoryId }) => createLeaf(batchId, index, inventoryId));
const levels = createMerkleLevels(leaves);
const root = levels.at(-1)?.[0];
const drawSeeds = Array.from({ length: totalSupply }, (_, drawIndex) => ({
  drawIndex,
  seed: `0x${randomBytes(32).toString("hex")}`
}));
const drawSeedLeaves = drawSeeds.map(({ drawIndex, seed }) =>
  createDrawSeedLeaf(batchId, drawIndex, seed)
);
const drawSeedLevels = createMerkleLevels(drawSeedLeaves);
const drawSeedRoot = drawSeedLevels.at(-1)?.[0];

if (!root || !drawSeedRoot) throw new Error("Could not create batch commitments");

const manifest = {
  packId,
  batchLabel,
  batchId,
  totalSupply,
  priceWei,
  odds,
  inventoryRoot: root,
  oddsCommitment: keccak256(stringToHex(JSON.stringify(odds))),
  drawSeedRoot,
  drawSeeds: drawSeeds.map((item) => ({
    ...item,
    leaf: drawSeedLeaves[item.drawIndex],
    proof: createProof(drawSeedLevels, item.drawIndex)
  })),
  inventory: inventory.map((item) => ({
    ...item,
    leaf: leaves[item.index],
    proof: createProof(levels, item.index)
  }))
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Prepared ${totalSupply} inventory commitments at ${outputPath}`);

function createLeaf(batchId, inventoryIndex, inventoryId) {
  return keccak256(encodeAbiParameters(
    [
      { type: "bytes32" },
      { type: "uint32" },
      { type: "bytes32" }
    ],
    [batchId, inventoryIndex, inventoryId]
  ));
}

function createDrawSeedLeaf(batchId, drawIndex, seed) {
  return keccak256(encodeAbiParameters(
    [
      { type: "bytes32" },
      { type: "uint32" },
      { type: "bytes32" }
    ],
    [batchId, drawIndex, seed]
  ));
}

function createMerkleLevels(leaves) {
  const levels = [leaves];

  while (levels.at(-1).length > 1) {
    const previous = levels.at(-1);
    const next = [];

    for (let index = 0; index < previous.length; index += 2) {
      next.push(hashPair(previous[index], previous[index + 1] ?? previous[index]));
    }
    levels.push(next);
  }

  return levels;
}

function createProof(levels, inventoryIndex) {
  const proof = [];
  let index = inventoryIndex;

  for (const level of levels.slice(0, -1)) {
    const siblingIndex = index % 2 === 0 ? index + 1 : index - 1;
    proof.push(level[siblingIndex] ?? level[index]);
    index = Math.floor(index / 2);
  }

  return proof;
}

function hashPair(left, right) {
  return left.toLowerCase() < right.toLowerCase()
    ? keccak256(concatHex([left, right]))
    : keccak256(concatHex([right, left]));
}
