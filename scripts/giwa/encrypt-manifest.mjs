import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { encryptBatchManifest } from "../../server/giwa/manifestStore.mjs";

const [inputPath, outputPath] = process.argv.slice(2);
const encryptionKey = process.env.GIWA_BATCH_MANIFEST_KEY;

if (!inputPath || !outputPath || !encryptionKey) {
  throw new Error(
    "Set GIWA_BATCH_MANIFEST_KEY and pass <input-json> <output-encrypted>."
  );
}

const manifest = JSON.parse(await readFile(inputPath, "utf8"));
const encryptedManifest = encryptBatchManifest(manifest, encryptionKey);

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${encryptedManifest}\n`, { mode: 0o600 });
console.log(`Encrypted ${manifest.batchLabel} at ${outputPath}`);
