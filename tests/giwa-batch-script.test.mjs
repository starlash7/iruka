import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import test from "node:test";
import {
  decryptBatchManifest,
  encryptBatchManifest
} from "../server/giwa/manifestStore.mjs";

const run = promisify(execFile);
const script = new URL("../scripts/giwa/prepare-batch.mjs", import.meta.url);
const odds = new URL("../scripts/giwa/debut-odds.json", import.meta.url);
const readSource = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("batch preparation commits every inventory item and creates Merkle proofs", async () => {
  const outputDirectory = await mkdtemp(join(tmpdir(), "iruka-giwa-"));
  const outputPath = join(outputDirectory, "batch.json");

  await run(process.execPath, [
    script.pathname,
    "IRK-GG-2026-001",
    "100",
    "1000000000000000",
    odds.pathname,
    outputPath,
    "debut"
  ]);

  const manifest = JSON.parse(await readFile(outputPath, "utf8"));
  assert.equal(manifest.packId, "debut");
  assert.equal(manifest.batchLabel, "IRK-GG-2026-001");
  assert.equal(manifest.totalSupply, 100);
  assert.equal(manifest.inventory.length, 100);
  assert.deepEqual(manifest.odds, {
    Common: 6000,
    Rare: 2800,
    Epic: 900,
    Legendary: 200,
    Iruka: 100
  });
  assert.match(manifest.batchId, /^0x[0-9a-f]{64}$/);
  assert.match(manifest.inventoryRoot, /^0x[0-9a-f]{64}$/);
  assert.match(manifest.drawSeedRoot, /^0x[0-9a-f]{64}$/);
  assert.equal(manifest.inventory[0].proof.length, 7);
  assert.equal(manifest.inventory[99].id, "debut-inventory-100");
  assert.equal(manifest.drawSeeds.length, 100);
  assert.match(manifest.drawSeeds[0].seed, /^0x[0-9a-f]{64}$/);
  assert.equal(manifest.drawSeeds[0].drawIndex, 0);
  assert.equal(manifest.drawSeeds[0].proof.length, 7);
  assert.equal(manifest.drawSeeds[99].drawIndex, 99);
  assert.notEqual(manifest.drawSeeds[0].seed, manifest.drawSeeds[1].seed);
});

test("pack ID controls the committed inventory IDs", async () => {
  const outputDirectory = await mkdtemp(join(tmpdir(), "iruka-giwa-"));
  const outputPath = join(outputDirectory, "batch.json");

  await run(process.execPath, [
    script.pathname,
    "IRK-GG-STAGE-001",
    "2",
    "1000000000000000",
    odds.pathname,
    outputPath,
    "stage"
  ]);

  const manifest = JSON.parse(await readFile(outputPath, "utf8"));
  assert.equal(manifest.packId, "stage");
  assert.deepEqual(
    manifest.inventory.map(({ id }) => id),
    ["stage-inventory-001", "stage-inventory-002"]
  );
});

test("operator scripts reject reverted receipts before reporting success", async () => {
  const [commitSource, fulfillSource] = await Promise.all([
    readSource("../scripts/giwa/commit-batch.mjs"),
    readSource("../scripts/giwa/fulfill-pull.mjs")
  ]);

  assert.match(commitSource, /receipt\.status !== "success"/);
  assert.match(fulfillSource, /receipt\.status !== "success"/);
});

test("batch manifests are encrypted at rest and reject the wrong key", () => {
  const manifest = {
    batchId: `0x${"1".repeat(64)}`,
    drawSeeds: [{ drawIndex: 0, seed: `0x${"2".repeat(64)}` }],
    packId: "debut"
  };
  const encryptionKey = Buffer.alloc(32, 7).toString("base64");
  const wrongKey = Buffer.alloc(32, 8).toString("base64");

  const encrypted = encryptBatchManifest(manifest, encryptionKey);

  assert.doesNotMatch(encrypted, new RegExp(manifest.drawSeeds[0].seed));
  assert.deepEqual(decryptBatchManifest(encrypted, encryptionKey), manifest);
  assert.throws(
    () => decryptBatchManifest(encrypted, wrongKey),
    /authenticate|decrypt/i
  );
});
