import {
  createCipheriv,
  createDecipheriv,
  randomBytes
} from "node:crypto";
import { readFile } from "node:fs/promises";

const ALGORITHM = "aes-256-gcm";
const DEFAULT_MANIFEST_URL = new URL(
  "./manifests/debut.json.enc",
  import.meta.url
);

export function encryptBatchManifest(manifest, encryptionKey) {
  const key = decodeEncryptionKey(encryptionKey);
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const plaintext = Buffer.from(JSON.stringify(manifest), "utf8");
  const ciphertext = Buffer.concat([
    cipher.update(plaintext),
    cipher.final()
  ]);

  return JSON.stringify({
    version: 1,
    iv: iv.toString("base64"),
    authTag: cipher.getAuthTag().toString("base64"),
    ciphertext: ciphertext.toString("base64")
  });
}

export function decryptBatchManifest(encryptedManifest, encryptionKey) {
  const key = decodeEncryptionKey(encryptionKey);

  try {
    const payload = JSON.parse(encryptedManifest);
    if (
      payload.version !== 1
      || typeof payload.iv !== "string"
      || typeof payload.authTag !== "string"
      || typeof payload.ciphertext !== "string"
    ) {
      throw new Error("Unsupported encrypted manifest");
    }

    const decipher = createDecipheriv(
      ALGORITHM,
      key,
      Buffer.from(payload.iv, "base64")
    );
    decipher.setAuthTag(Buffer.from(payload.authTag, "base64"));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(payload.ciphertext, "base64")),
      decipher.final()
    ]);
    return JSON.parse(plaintext.toString("utf8"));
  } catch (error) {
    throw new Error("Could not decrypt batch manifest", { cause: error });
  }
}

export async function loadBatchManifest(
  batchId,
  encryptionKey,
  manifestUrl = DEFAULT_MANIFEST_URL
) {
  const encryptedManifest = await readFile(manifestUrl, "utf8");
  const manifest = decryptBatchManifest(encryptedManifest, encryptionKey);

  if (manifest.batchId?.toLowerCase() !== batchId.toLowerCase()) {
    throw new Error("The pull does not match the configured batch manifest");
  }
  return manifest;
}

function decodeEncryptionKey(value) {
  if (typeof value !== "string") {
    throw new Error("Batch manifest encryption key is not configured");
  }

  const key = Buffer.from(value, "base64");
  if (key.length !== 32) {
    throw new Error("Batch manifest encryption key must contain 32 bytes");
  }
  return key;
}
