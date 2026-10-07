import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import test from "node:test";
import {
  decryptBatchManifest,
  encryptBatchManifest
} from "../server/monad/manifestStore.mjs";

const run = promisify(execFile);
const script = new URL("../scripts/monad/prepare-batch.mjs", import.meta.url);
const odds = new URL("../scripts/monad/debut-odds.json", import.meta.url);
const readSource = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("batch preparation commits every inventory item and creates Merkle proofs", async () => {
  const outputDirectory = await mkdtemp(join(tmpdir(), "iruka-giwa-"));
  const outputPath = join(outputDirectory, "batch.json");

  await run(process.execPath, [
    script.pathname,
    "IRK-MON-2026-001",
    "100",
    "10000000000000",
    odds.pathname,
    outputPath,
    "debut"
  ]);

  const manifest = JSON.parse(await readFile(outputPath, "utf8"));
  assert.equal(manifest.packId, "debut");
  assert.equal(manifest.batchLabel, "IRK-MON-2026-001");
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
  assert.equal((await stat(outputPath)).mode & 0o777, 0o600);
});

test("operator scripts reject reverted receipts before reporting success", async () => {
  const [commitSource, fulfillSource] = await Promise.all([
    readSource("../scripts/monad/commit-batch.mjs"),
    readSource("../scripts/monad/fulfill-pull.mjs")
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

test("preparation creates fresh seeds, preserves frontend order and rejects overwrite", async () => {
  const directory = await mkdtemp(join(tmpdir(), "iruka-monad-"));
  const paths = [join(directory, "first.json"), join(directory, "second.json")];
  for (const output of paths) await run(process.execPath, [script.pathname, "IRK-MON-2026-001", "100", "10000000000000", odds.pathname, output, "debut"]);
  const [first, second] = await Promise.all(paths.map(async path => JSON.parse(await readFile(path, "utf8"))));
  const { concatHex, keccak256, encodeAbiParameters } = await import("viem");
  assert.equal(first.chainId, 10143);
  assert.equal(first.priceWei, "10000000000000");
  assert.notEqual(first.drawSeedRoot, second.drawSeedRoot);
  for (let index = 0; index < 100; index++) {
    assert.equal(first.inventory[index].id, `debut-inventory-${String(index + 1).padStart(3, "0")}`);
    for (const [item, value, root] of [
      [first.inventory[index], first.inventory[index].inventoryId, first.inventoryRoot],
      [first.drawSeeds[index], first.drawSeeds[index].seed, first.drawSeedRoot]
    ]) {
      let hash = keccak256(encodeAbiParameters([{type:"bytes32"},{type:"uint32"},{type:"bytes32"}], [first.batchId,index,value]));
      for (const sibling of item.proof) hash = keccak256(concatHex([hash, sibling].sort()));
      assert.equal(hash, root);
    }
  }
  await assert.rejects(run(process.execPath, [script.pathname, "IRK-MON-2026-001", "100", "10000000000000", odds.pathname, paths[0], "debut"]), /EEXIST/);
  await assert.rejects(run(process.execPath, [script.pathname, "IRK-GG-2026-001", "100", "10000000000000", odds.pathname, join(directory,"wrong.json"), "debut"]), /Usage/);
});

test("operator CLIs fail clearly without Monad credentials", async () => {
  for (const name of ["commit-batch", "encrypt-manifest", "fulfill-pull", "deploy-pack-batch"]) {
    await assert.rejects(run(process.execPath, [new URL(`../scripts/monad/${name}.mjs`, import.meta.url).pathname], {env: {PATH: process.env.PATH}}), /Monad|MONAD/);
  }
});

test("deployment enforces current official Foundry requirements", async () => {
  const { assertMonadForgeVersion } = await import("../scripts/monad/deploymentForge.mjs");
  assert.throws(() => assertMonadForgeVersion("forge Version: 1.7.1"), /1.8/);
  assert.doesNotThrow(() => assertMonadForgeVersion("forge Version: 1.8.0"));
  assert.doesNotThrow(() => assertMonadForgeVersion("forge Version: 2.0.0"));
});

test("commit ABI is initialized before transaction submission", async () => {
  const source = await readSource("../scripts/monad/commit-batch.mjs");
  assert.ok(source.indexOf("const packBatchAbi") < source.indexOf("abi: packBatchAbi"));
});

test("encrypted Monad loader rejects GIWA and malformed commitments", async () => {
  const {assertMonadBatchManifest, loadDefaultBatchManifest} = await import("../server/monad/manifestStore.mjs");
  const {writeFile} = await import("node:fs/promises");
  const directory = await mkdtemp(join(tmpdir(), "iruka-monad-loader-"));
  const path = join(directory,"manifest.json");
  await run(process.execPath,[script.pathname,"IRK-MON-2026-001","100","10000000000000",odds.pathname,path,"debut"]);
  const manifest = JSON.parse(await readFile(path,"utf8"));
  const key = Buffer.alloc(32,11).toString("base64");
  const encryptedPath = join(directory,"manifest.enc");
  await writeFile(encryptedPath,encryptBatchManifest(manifest,key));
  assert.deepEqual(await loadDefaultBatchManifest(key,encryptedPath),manifest);
  assert.throws(() => assertMonadBatchManifest({...manifest,chainId:91342}), /Monad/);
  assert.throws(() => assertMonadBatchManifest({...manifest,drawSeedRoot:`0x${"0".repeat(64)}`}), /commitment/i);
  assert.throws(() => assertMonadBatchManifest({...manifest,odds:{Common:10000}}), /odds/i);
});

test("fresh-contract guard scans bounded ranges from verified deployment receipt", async () => {
  const {assertFreshMonadContract} = await import("../scripts/monad/commitGuard.mjs");
  const address = `0x${"1".repeat(40)}`;
  const calls = [];
  const client = {
    getTransactionReceipt: async () => ({status:"success",contractAddress:address,blockNumber:1000n}),
    getBlockNumber: async () => 1205n,
    getLogs: async ({fromBlock,toBlock}) => {calls.push([fromBlock,toBlock]); return [];}
  };
  await assertFreshMonadContract(client,address,`0x${"2".repeat(64)}`);
  assert.deepEqual(calls, [[1000n,1099n],[1100n,1199n],[1200n,1205n]]);
  await assert.rejects(assertFreshMonadContract({...client,getLogs:async () => [{}]},address,`0x${"2".repeat(64)}`), /exactly one batch/);
  await assert.rejects(assertFreshMonadContract(client,`0x${"3".repeat(40)}`,`0x${"2".repeat(64)}`), /deployment receipt/);
});


test("Monad deploy rejects a zero Keeper before decoding credentials or making RPC calls", async () => {
  await assert.rejects(run(process.execPath, [new URL("../scripts/monad/deploy-pack-batch.mjs", import.meta.url).pathname], {
    env: { ...process.env, MONAD_DEPLOYER_PRIVATE_KEY: `0x${"00".repeat(32)}`,
      IRUKA_MONAD_KEEPER_ADDRESS: `0x${"00".repeat(20)}`, MONAD_TESTNET_RPC_URL: "http://127.0.0.1:1" }
  }), /IRUKA_MONAD_KEEPER_ADDRESS/);
});
