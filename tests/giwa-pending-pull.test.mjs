import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createServer } from "vite";

const walletAddress = "0x0000000000000000000000000000000000000001";
const contractAddress = "0x0000000000000000000000000000000000000002";
const batchId = `0x${"11".repeat(32)}`;
const transactionHash = `0x${"22".repeat(32)}`;

let clearPendingGiwaPull;
let createPendingGiwaPull;
let getPendingGiwaPull;
let getPendingGiwaPullReceipt;
let savePendingGiwaPull;
let server;

function createStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, value)
  };
}

before(async () => {
  server = await createServer({
    appType: "custom",
    optimizeDeps: { noDiscovery: true },
    server: { hmr: false, middlewareMode: true }
  });

  ({
    clearPendingGiwaPull,
    createPendingGiwaPull,
    getPendingGiwaPull,
    getPendingGiwaPullReceipt,
    savePendingGiwaPull
  } = await server.ssrLoadModule("/src/giwaPendingPull.ts"));
});

after(async () => {
  await server?.close();
});

test("persists a submitted pull before its receipt is available", () => {
  const storage = createStorage();
  const pending = createPendingGiwaPull({
    batchId,
    contractAddress,
    packId: "debut",
    requestTransactionHash: transactionHash,
    walletAddress
  });

  savePendingGiwaPull(storage, pending);

  assert.deepEqual(getPendingGiwaPull(storage, walletAddress), pending);
  assert.equal(getPendingGiwaPullReceipt(pending), undefined);
});

test("restores confirmed receipt values without losing bigint precision", () => {
  const storage = createStorage();
  const pending = createPendingGiwaPull({
    batchId,
    contractAddress,
    packId: "debut",
    requestTransactionHash: transactionHash,
    walletAddress
  });
  const confirmed = {
    ...pending,
    drawIndex: 19,
    requestBlockNumber: "31782905",
    requestId: "9007199254740993"
  };

  savePendingGiwaPull(storage, confirmed);

  assert.deepEqual(getPendingGiwaPullReceipt(confirmed), {
    collector: walletAddress,
    batchId,
    contractAddress,
    drawIndex: 19,
    explorerUrl: `https://sepolia-explorer.giwa.io/tx/${transactionHash}`,
    requestBlockNumber: 31782905n,
    requestId: 9007199254740993n,
    requestTransactionHash: transactionHash
  });
});

test("keeps pending pulls isolated by wallet and only clears the matching hash", () => {
  const storage = createStorage();
  const pending = createPendingGiwaPull({
    batchId,
    contractAddress,
    packId: "debut",
    requestTransactionHash: transactionHash,
    walletAddress
  });
  savePendingGiwaPull(storage, pending);

  assert.equal(
    getPendingGiwaPull(
      storage,
      "0x0000000000000000000000000000000000000003"
    ),
    undefined
  );
  clearPendingGiwaPull(storage, walletAddress, `0x${"33".repeat(32)}`);
  assert.deepEqual(getPendingGiwaPull(storage, walletAddress), pending);

  clearPendingGiwaPull(storage, walletAddress, transactionHash);
  assert.equal(getPendingGiwaPull(storage, walletAddress), undefined);
});

test("storage restrictions do not interrupt GIWA pull confirmation", () => {
  const restrictedStorage = {
    getItem: () => {
      throw new DOMException("Blocked", "SecurityError");
    },
    removeItem: () => {
      throw new DOMException("Blocked", "SecurityError");
    },
    setItem: () => {
      throw new DOMException("Blocked", "SecurityError");
    }
  };
  const pending = createPendingGiwaPull({
    batchId,
    contractAddress,
    packId: "debut",
    requestTransactionHash: transactionHash,
    walletAddress
  });

  assert.equal(getPendingGiwaPull(restrictedStorage, walletAddress), undefined);
  assert.doesNotThrow(() => savePendingGiwaPull(restrictedStorage, pending));
  assert.doesNotThrow(() =>
    clearPendingGiwaPull(restrictedStorage, walletAddress, transactionHash)
  );
});

test("denied browser storage getter does not crash pending restoration", () => {
  const previousWindow = globalThis.window;
  globalThis.window = { get localStorage() { throw new DOMException("Blocked", "SecurityError"); } };
  try {
    assert.equal(getPendingGiwaPull(undefined, walletAddress), undefined);
    assert.doesNotThrow(() => clearPendingGiwaPull(undefined, walletAddress));
  } finally { globalThis.window = previousWindow; }
});
