import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createServer } from "vite";

const walletAddress = "0x0000000000000000000000000000000000000001";
const transactionHash = `0x${"44".repeat(32)}`;

let clearPendingGiwaTransfer;
let createPendingGiwaTransfer;
let getPendingGiwaTransfer;
let savePendingGiwaTransfer;
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
    clearPendingGiwaTransfer,
    createPendingGiwaTransfer,
    getPendingGiwaTransfer,
    savePendingGiwaTransfer
  } = await server.ssrLoadModule("/src/giwaPendingTransfer.ts"));
});

after(async () => {
  await server?.close();
});

test("persists an account transfer by sender until its receipt is confirmed", () => {
  const storage = createStorage();
  const pending = createPendingGiwaTransfer({
    direction: "withdraw",
    transactionHash,
    walletAddress
  });

  savePendingGiwaTransfer(storage, pending);

  assert.deepEqual(getPendingGiwaTransfer(storage, walletAddress), pending);
});

test("does not clear a newer account transfer with an older hash", () => {
  const storage = createStorage();
  const pending = createPendingGiwaTransfer({
    direction: "deposit",
    transactionHash,
    walletAddress
  });
  savePendingGiwaTransfer(storage, pending);

  clearPendingGiwaTransfer(storage, walletAddress, `0x${"55".repeat(32)}`);
  assert.deepEqual(getPendingGiwaTransfer(storage, walletAddress), pending);

  clearPendingGiwaTransfer(storage, walletAddress, transactionHash);
  assert.equal(getPendingGiwaTransfer(storage, walletAddress), undefined);
});

test("storage restrictions do not interrupt a submitted account transfer", () => {
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
  const pending = createPendingGiwaTransfer({
    direction: "deposit",
    transactionHash,
    walletAddress
  });

  assert.equal(
    getPendingGiwaTransfer(restrictedStorage, walletAddress),
    undefined
  );
  assert.doesNotThrow(() =>
    savePendingGiwaTransfer(restrictedStorage, pending)
  );
  assert.doesNotThrow(() =>
    clearPendingGiwaTransfer(restrictedStorage, walletAddress, transactionHash)
  );
});

test("denied browser storage getter does not crash transfer restoration", () => {
  const previousWindow = globalThis.window;
  globalThis.window = { get localStorage() { throw new DOMException("Blocked", "SecurityError"); } };
  try {
    assert.equal(getPendingGiwaTransfer(undefined, walletAddress), undefined);
    assert.doesNotThrow(() => clearPendingGiwaTransfer(undefined, walletAddress));
  } finally { globalThis.window = previousWindow; }
});
