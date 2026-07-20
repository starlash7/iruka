import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import test from "node:test";

const run = promisify(execFile);
const script = new URL("../scripts/giwa/prepare-batch.mjs", import.meta.url);
const odds = new URL("../scripts/giwa/debut-odds.json", import.meta.url);

test("batch preparation commits every inventory item and creates Merkle proofs", async () => {
  const outputDirectory = await mkdtemp(join(tmpdir(), "iruka-giwa-"));
  const outputPath = join(outputDirectory, "batch.json");

  await run(process.execPath, [
    script.pathname,
    "IRK-GG-2026-001",
    "4",
    "1000000000000000",
    odds.pathname,
    outputPath
  ]);

  const manifest = JSON.parse(await readFile(outputPath, "utf8"));
  assert.equal(manifest.batchLabel, "IRK-GG-2026-001");
  assert.equal(manifest.totalSupply, 4);
  assert.equal(manifest.inventory.length, 4);
  assert.match(manifest.batchId, /^0x[0-9a-f]{64}$/);
  assert.match(manifest.inventoryRoot, /^0x[0-9a-f]{64}$/);
  assert.equal(manifest.inventory[0].proof.length, 2);
  assert.equal(manifest.inventory[3].id, "debut-inventory-004");
});
