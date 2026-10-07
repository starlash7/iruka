import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createServer } from "vite";

const walletAddress = "0x0000000000000000000000000000000000000001";
const card = {
  category: "K-pop",
  estimatedValue: 21,
  group: "Debut Pack",
  id: "pull-1",
  imageStyle: "card-style-1",
  member: "Ari",
  packId: "debut",
  pulledAt: "12:00 PM",
  rarity: "Rare",
  serial: "IRK-0001",
  vaultStatus: "Pulled"
};

let getWalletCardCollection;
let saveWalletCardCollection;
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
  ({ getWalletCardCollection, saveWalletCardCollection } =
    await server.ssrLoadModule("/src/cardCollectionStorage.ts"));
});

after(async () => {
  await server?.close();
});

test("restores revealed cards only for the matching Iruka wallet", () => {
  const storage = createStorage();
  saveWalletCardCollection(storage, walletAddress, [card]);

  assert.deepEqual(
    getWalletCardCollection(storage, walletAddress),
    [card]
  );
  assert.deepEqual(
    getWalletCardCollection(
      storage,
      "0x0000000000000000000000000000000000000002"
    ),
    []
  );
});

test("drops malformed card records instead of breaking account rendering", () => {
  const storage = createStorage();
  storage.setItem(
    `iruka:collection:91342:${walletAddress.toLowerCase()}`,
    JSON.stringify([{ id: "missing-fields" }, card])
  );

  assert.deepEqual(getWalletCardCollection(storage, walletAddress), [card]);
});

test("storage restrictions do not block account rendering or a completed reveal", () => {
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

  assert.deepEqual(
    getWalletCardCollection(restrictedStorage, walletAddress),
    []
  );
  assert.doesNotThrow(() =>
    saveWalletCardCollection(restrictedStorage, walletAddress, [card])
  );
});


test("acknowledges durable writes and reports quota failure", () => {
  assert.equal(saveWalletCardCollection(createStorage(), walletAddress, [card]), true);
  const storage = createStorage();
  storage.setItem = () => { throw new DOMException("Full", "QuotaExceededError"); };
  assert.equal(saveWalletCardCollection(storage, walletAddress, [card]), false);
});

test("denied browser storage getter does not crash collection restoration", () => {
  const previousWindow = globalThis.window;
  globalThis.window = { get localStorage() { throw new DOMException("Blocked", "SecurityError"); } };
  try {
    assert.deepEqual(getWalletCardCollection(undefined, walletAddress), []);
    assert.equal(saveWalletCardCollection(undefined, walletAddress, [card]), false);
  } finally { globalThis.window = previousWindow; }
});
