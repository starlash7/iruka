import { readFile } from "node:fs/promises";
import { concatHex, encodeAbiParameters, keccak256, stringToHex } from "viem";
import { decryptBatchManifest } from "../giwa/manifestStore.mjs";
export { encryptBatchManifest, decryptBatchManifest } from "../giwa/manifestStore.mjs";

export function assertMonadBatchManifest(manifest) {
  if (manifest.chainId !== 10143
    || manifest.batchLabel !== "IRK-MON-2026-001"
    || manifest.batchId !== keccak256(stringToHex("IRK-MON-2026-001"))
    || manifest.packId !== "debut"
    || manifest.totalSupply !== 100
    || manifest.priceWei !== "10000000000000"
    || manifest.inventory?.length !== 100
    || manifest.drawSeeds?.length !== 100) {
    throw new Error("Manifest must be the independent Monad Debut batch");
  }
  const odds = {Common: 6000, Rare: 2800, Epic: 900, Legendary: 200, Iruka: 100};
  if (JSON.stringify(manifest.odds) !== JSON.stringify(odds)
    || manifest.oddsCommitment !== keccak256(stringToHex(JSON.stringify(odds)))) {
    throw new Error("Monad manifest odds do not match Debut");
  }
  for (let index = 0; index < 100; index += 1) {
    const id = `debut-inventory-${String(index + 1).padStart(3, "0")}`;
    const item = manifest.inventory[index];
    if (item.index !== index || item.id !== id
      || item.inventoryId !== keccak256(stringToHex(id))
      || manifest.drawSeeds[index].drawIndex !== index) {
      throw new Error("Monad manifest inventory order or draw order is invalid");
    }
    assertCommitment(manifest.batchId, index, item.inventoryId, item.proof, manifest.inventoryRoot);
    const draw = manifest.drawSeeds[index];
    assertCommitment(manifest.batchId, index, draw.seed, draw.proof, manifest.drawSeedRoot);
  }
  return manifest;
}

export async function loadDefaultBatchManifest(
  encryptionKey,
  manifestUrl = new URL("./manifests/debut.json.enc", import.meta.url)
) {
  const encrypted = await readFile(manifestUrl, "utf8");
  return assertMonadBatchManifest(decryptBatchManifest(encrypted, encryptionKey));
}

function assertCommitment(batchId, index, value, proof, root) {
  let hash = keccak256(encodeAbiParameters(
    [{type: "bytes32"}, {type: "uint32"}, {type: "bytes32"}],
    [batchId, index, value]
  ));
  for (const sibling of proof) hash = keccak256(concatHex([hash, sibling].sort()));
  if (hash !== root) throw new Error("Monad manifest commitment proof is invalid");
}
