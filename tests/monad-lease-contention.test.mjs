import assert from "node:assert/strict";
import test from "node:test";
import { BlobNotFoundError, BlobPreconditionFailedError } from "@vercel/blob";
import {
  acquireFulfillmentLease,
  createFulfillmentLeaseKey,
  releaseFulfillmentLease,
  renewFulfillmentLease
} from "../server/monad/fulfillmentLease.mjs";
import { fulfillPullRequest } from "../server/monad/fulfillRequest.mjs";
import { getNextPendingRequestId } from "../server/monad/recoverPendingPull.mjs";

// Replace only the external Blob service; exercise the production lease functions.
function createBlobStore() {
  const blobs = new Map();
  let revision = 0;
  let time = Date.parse("2026-10-06T00:00:00Z");
  const operations = {
    async put(pathname, _body, options) {
      const current = blobs.get(pathname);
      if ((!options.allowOverwrite && current)
        || (options.ifMatch && options.ifMatch !== current?.etag)) {
        throw new BlobPreconditionFailedError();
      }
      const blob = { etag: String(++revision), uploadedAt: new Date(time) };
      blobs.set(pathname, blob);
      return { ...blob };
    },
    async head(pathname) {
      const blob = blobs.get(pathname);
      if (!blob) throw new BlobNotFoundError();
      return { ...blob };
    },
    async del(pathname, options) {
      const blob = blobs.get(pathname);
      if (!blob) throw new BlobNotFoundError();
      if (options.ifMatch && options.ifMatch !== blob.etag) {
        throw new BlobPreconditionFailedError();
      }
      blobs.delete(pathname);
    }
  };
  return {
    operations,
    options: { operations, now: () => time },
    advanceTime(milliseconds) { time += milliseconds; }
  };
}

const leaseKey = createFulfillmentLeaseKey("0xABC", 1n);
const batchId = `0x${"1".repeat(64)}`;
const inventoryId = `0x${"2".repeat(64)}`;
const manifest = {
  batchId,
  drawSeeds: [0, 1].map((drawIndex) => ({ drawIndex, seed: "seed", proof: [] })),
  inventory: [0, 1].map((index) => ({ index, inventoryId, proof: [] }))
};

function getLeaseCallbacks(store, requestId) {
  const key = createFulfillmentLeaseKey("0xABC", requestId);
  return {
    acquireLease: () => acquireFulfillmentLease(key, store.options),
    renewLease: (_id, lease) => renewFulfillmentLease(key, lease, store.options),
    releaseLease: (_id, lease) => releaseFulfillmentLease(key, lease, store.operations)
  };
}

test("twenty concurrent Monad lease acquisitions grant exactly one owner", async () => {
  const store = createBlobStore();
  const leases = await Promise.all(Array.from({ length: 20 }, () =>
    acquireFulfillmentLease(leaseKey, store.options)));
  assert.equal(leases.filter(Boolean).length, 1);
});

test("twenty concurrent stale-lease takeovers grant exactly one replacement", async () => {
  const store = createBlobStore();
  const initial = await acquireFulfillmentLease(leaseKey, store.options);
  store.advanceTime(120_001);
  const leases = await Promise.all(Array.from({ length: 20 }, () =>
    acquireFulfillmentLease(leaseKey, store.options)));
  assert.equal(leases.filter(Boolean).length, 1);
  assert.notEqual(leases.find(Boolean).etag, initial.etag);
});

test("a replaced owner cannot renew or delete the new Monad lease", async () => {
  const store = createBlobStore();
  const initial = await acquireFulfillmentLease(leaseKey, store.options);
  store.advanceTime(120_001);
  const replacement = await acquireFulfillmentLease(leaseKey, store.options);
  assert.equal(await renewFulfillmentLease(leaseKey, initial, store.options), undefined);
  await releaseFulfillmentLease(leaseKey, initial, store.operations);
  assert.equal((await store.operations.head(leaseKey)).etag, replacement.etag);
  assert.equal(await acquireFulfillmentLease(leaseKey, store.options), undefined);
});

test("a Keeper that loses its lease during preview cannot broadcast", async () => {
  const store = createBlobStore();
  let replacement;
  let submissions = 0;
  const result = await fulfillPullRequest({
    manifest,
    requestId: 1n,
    ...getLeaseCallbacks(store, 1n),
    readPull: async () => ({ batchId, drawIndex: 0, fulfilled: false }),
    readBatch: async () => ({ nextFulfillIndex: 0 }),
    previewDraw: async () => {
      store.advanceTime(120_001);
      replacement = await acquireFulfillmentLease(leaseKey, store.options);
      return { inventoryIndex: 0 };
    },
    submitFulfillment: async () => { submissions += 1; return "unused"; }
  });
  assert.deepEqual(result, { status: "pending" });
  assert.equal(submissions, 0);
  assert.equal((await store.operations.head(leaseKey)).etag, replacement.etag);
});

test("overlapping browser and recovery triggers submit each pending draw once in order", async () => {
  const store = createBlobStore();
  const submissions = [];
  let nextFulfillIndex = 0;
  const pulls = [0, 1].map((drawIndex) => ({ batchId, drawIndex, fulfilled: false }));
  const trigger = (requestId) => fulfillPullRequest({
    manifest,
    requestId,
    ...getLeaseCallbacks(store, requestId),
    readPull: async (id) => ({ ...pulls[Number(id) - 1] }),
    readBatch: async () => ({ nextFulfillIndex }),
    previewDraw: async ({ requestId: id }) => ({ inventoryIndex: Number(id) - 1 }),
    submitFulfillment: async ({ requestId: id }) => {
      submissions.push(id);
      return `transaction-${id}`;
    }
  });
  const recover = () => {
    const id = getNextPendingRequestId({ nextDrawIndex: 2, nextFulfillIndex });
    return id ? trigger(id) : Promise.resolve({ status: "idle" });
  };
  const confirm = (index) => {
    Object.assign(pulls[index], { fulfilled: true, inventoryId, inventoryIndex: index });
    nextFulfillIndex += 1;
  };

  assert.equal((await trigger(2n)).status, "pending");
  assert.deepEqual(submissions, []);
  const first = await Promise.all([trigger(1n), recover()]);
  assert.deepEqual(first.map(({ status }) => status).sort(), ["pending", "submitted"]);
  assert.deepEqual(submissions, [1n]);
  assert.equal((await recover()).status, "pending");
  confirm(0);
  assert.equal((await trigger(1n)).status, "fulfilled");
  const second = await Promise.all([recover(), trigger(2n)]);
  assert.deepEqual(second.map(({ status }) => status).sort(), ["pending", "submitted"]);
  assert.deepEqual(submissions, [1n, 2n]);
  confirm(1);
  assert.equal((await recover()).status, "idle");
  assert.equal((await trigger(2n)).status, "fulfilled");
  assert.deepEqual(submissions, [1n, 2n]);
});


test("slow transaction preparation cannot broadcast after its lease is replaced", async () => {
  const store = createBlobStore();
  let prepared = false, sends = 0, replacement;
  const result = await fulfillPullRequest({
    manifest, requestId: 1n, ...getLeaseCallbacks(store, 1n),
    readPull: async () => ({ batchId, drawIndex: 0, fulfilled: false }),
    readBatch: async () => ({ nextFulfillIndex: 0 }),
    previewDraw: async () => ({ inventoryIndex: 0 }),
    prepareFulfillment: async () => {
      prepared = true;
      store.advanceTime(120001);
      replacement = await acquireFulfillmentLease(leaseKey, store.options);
      return 'signed-transaction';
    },
    submitFulfillment: async () => { sends++; return 'transaction'; }
  });
  assert.equal(prepared, true, 'real preparation must precede final fencing');
  assert.equal(result.status, 'pending');
  assert.equal(sends, 0);
  assert.ok(replacement);
  assert.equal((await store.operations.head(leaseKey)).etag, replacement.etag);
});

test("transaction preparation failure releases the lease without sending", async () => {
  const store = createBlobStore();
  let sends = 0;
  await assert.rejects(fulfillPullRequest({
    manifest, requestId: 1n, ...getLeaseCallbacks(store, 1n),
    readPull: async () => ({ batchId, drawIndex: 0, fulfilled: false }),
    readBatch: async () => ({ nextFulfillIndex: 0 }),
    previewDraw: async () => ({ inventoryIndex: 0 }),
    prepareFulfillment: async () => { throw new Error('RPC preparation failed'); },
    submitFulfillment: async () => { sends++; return 'transaction'; }
  }), /RPC preparation failed/);
  assert.equal(sends, 0);
  await assert.rejects(store.operations.head(leaseKey), BlobNotFoundError);
});


test("confirmation during transaction preparation returns the existing fulfillment", async () => {
  const store = createBlobStore();
  let reads = 0, sends = 0;
  const result = await fulfillPullRequest({
    manifest, requestId: 1n, ...getLeaseCallbacks(store, 1n),
    readPull: async () => ({ batchId, drawIndex: 0, fulfilled: ++reads > 1, inventoryId, inventoryIndex: 0 }),
    readBatch: async () => ({ nextFulfillIndex: 0 }),
    previewDraw: async () => ({ inventoryIndex: 0 }),
    prepareFulfillment: async () => { throw new Error('PullAlreadyFulfilled during gas estimation'); },
    submitFulfillment: async () => { sends++; return 'transaction'; }
  });
  assert.deepEqual(result, { status: 'fulfilled', inventoryId, inventoryIndex: 0 });
  assert.equal(sends, 0);
  await assert.rejects(store.operations.head(leaseKey), BlobNotFoundError);
});
