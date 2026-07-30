import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  fulfillPullRequest
} from "../server/giwa/fulfillRequest.mjs";
import {
  acquireFulfillmentLease,
  releaseFulfillmentLease,
  renewFulfillmentLease
} from "../server/giwa/fulfillmentLease.mjs";
import {
  getNextPendingRequestId
} from "../server/giwa/recoverPendingPull.mjs";
import {
  parseFulfillmentRequest
} from "../api/giwa/fulfill.mjs";
import {
  isAuthorizedCronRequest
} from "../api/giwa/recover.mjs";

const batchId = `0x${"1".repeat(64)}`;
const inventoryId = `0x${"2".repeat(64)}`;
const manifest = {
  batchId,
  drawSeeds: [{
    drawIndex: 0,
    proof: [`0x${"3".repeat(64)}`],
    seed: `0x${"4".repeat(64)}`
  }],
  inventory: [{
    index: 0,
    inventoryId,
    proof: [`0x${"5".repeat(64)}`]
  }]
};

test("fulfilled requests return their existing result without another transaction", async () => {
  let submitCount = 0;
  const result = await fulfillPullRequest({
    manifest,
    requestId: 1n,
    readBatch: async () => ({ nextFulfillIndex: 1 }),
    readPull: async () => ({
      batchId,
      drawIndex: 0,
      fulfilled: true,
      inventoryId,
      inventoryIndex: 0
    }),
    previewDraw: async () => {
      throw new Error("preview should not run");
    },
    submitFulfillment: async () => {
      submitCount += 1;
      return "0xunused";
    }
  });

  assert.deepEqual(result, {
    status: "fulfilled",
    inventoryId,
    inventoryIndex: 0
  });
  assert.equal(submitCount, 0);
});

test("out-of-order requests remain pending without spending keeper gas", async () => {
  let submitCount = 0;
  const result = await fulfillPullRequest({
    manifest,
    requestId: 2n,
    readBatch: async () => ({ nextFulfillIndex: 0 }),
    readPull: async () => ({
      batchId,
      drawIndex: 1,
      fulfilled: false,
      inventoryId: `0x${"0".repeat(64)}`,
      inventoryIndex: 0
    }),
    previewDraw: async () => {
      throw new Error("preview should not run");
    },
    submitFulfillment: async () => {
      submitCount += 1;
      return "0xunused";
    }
  });

  assert.deepEqual(result, { status: "pending", nextFulfillIndex: 0 });
  assert.equal(submitCount, 0);
});

test("the next request submits its committed seed and inventory proof", async () => {
  let submitted;
  const transactionHash = `0x${"6".repeat(64)}`;
  const result = await fulfillPullRequest({
    manifest,
    requestId: 1n,
    readBatch: async () => ({ nextFulfillIndex: 0 }),
    readPull: async () => ({
      batchId,
      drawIndex: 0,
      fulfilled: false,
      inventoryId: `0x${"0".repeat(64)}`,
      inventoryIndex: 0
    }),
    previewDraw: async (input) => {
      assert.equal(input.serverSeed, manifest.drawSeeds[0].seed);
      return { inventoryIndex: 0 };
    },
    submitFulfillment: async (input) => {
      submitted = input;
      return transactionHash;
    }
  });

  assert.equal(submitted.inventoryId, inventoryId);
  assert.deepEqual(submitted.inventoryProof, manifest.inventory[0].proof);
  assert.deepEqual(submitted.seedProof, manifest.drawSeeds[0].proof);
  assert.deepEqual(result, {
    status: "submitted",
    transactionHash,
    inventoryId,
    inventoryIndex: 0
  });
});

test("the environment Keeper does not read a pull twice before fulfillment", async () => {
  const source = await readFile(
    new URL("../server/giwa/fulfillRequest.mjs", import.meta.url),
    "utf8"
  );

  assert.match(source, /loadDefaultBatchManifest/);
  assert.doesNotMatch(source, /const initialPull = await readPull/);
});

test("a concurrent fulfillment race returns the newly confirmed result", async () => {
  let readCount = 0;
  const result = await fulfillPullRequest({
    manifest,
    requestId: 1n,
    readBatch: async () => ({ nextFulfillIndex: 0 }),
    readPull: async () => {
      readCount += 1;
      return {
        batchId,
        drawIndex: 0,
        fulfilled: readCount > 1,
        inventoryId,
        inventoryIndex: 0
      };
    },
    previewDraw: async () => ({ inventoryIndex: 0 }),
    submitFulfillment: async () => {
      throw new Error("already fulfilled");
    }
  });

  assert.deepEqual(result, {
    status: "fulfilled",
    inventoryId,
    inventoryIndex: 0
  });
});

test("a shared lease allows only one concurrent Keeper submission", async () => {
  let leased = false;
  let submissions = 0;
  const acquireLease = async () => {
    if (leased) return false;
    leased = true;
    return true;
  };
  const createRequest = () => fulfillPullRequest({
    manifest,
    requestId: 1n,
    acquireLease,
    readPull: async () => ({
      batchId,
      drawIndex: 0,
      fulfilled: false,
      inventoryId: `0x${"0".repeat(64)}`,
      inventoryIndex: 0
    }),
    readBatch: async () => ({ nextFulfillIndex: 0 }),
    previewDraw: async () => ({ inventoryIndex: 0 }),
    submitFulfillment: async () => {
      submissions += 1;
      return `0x${"6".repeat(64)}`;
    }
  });

  const results = await Promise.all([createRequest(), createRequest()]);

  assert.equal(submissions, 1);
  assert.deepEqual(
    results.map((result) => result.status).sort(),
    ["pending", "submitted"]
  );
});

test("the Keeper renews its lease before broadcasting", async () => {
  const calls = [];
  const result = await fulfillPullRequest({
    manifest,
    requestId: 1n,
    acquireLease: async () => ({ etag: "initial" }),
    renewLease: async (_requestId, lease) => {
      calls.push(`renew:${lease.etag}`);
      return { etag: "renewed" };
    },
    releaseLease: async () => {
      calls.push("release");
    },
    readPull: async () => ({
      batchId,
      drawIndex: 0,
      fulfilled: false,
      inventoryId: `0x${"0".repeat(64)}`,
      inventoryIndex: 0
    }),
    readBatch: async () => ({ nextFulfillIndex: 0 }),
    previewDraw: async () => ({ inventoryIndex: 0 }),
    submitFulfillment: async () => {
      calls.push("submit");
      return `0x${"6".repeat(64)}`;
    }
  });

  assert.equal(result.status, "submitted");
  assert.deepEqual(calls, ["renew:initial", "submit"]);
});

test("an ambiguous broadcast failure keeps the lease until expiry", async () => {
  let releaseCount = 0;
  await assert.rejects(
    fulfillPullRequest({
      manifest,
      requestId: 1n,
      acquireLease: async () => ({ etag: "initial" }),
      renewLease: async () => ({ etag: "renewed" }),
      releaseLease: async () => {
        releaseCount += 1;
      },
      readPull: async () => ({
        batchId,
        drawIndex: 0,
        fulfilled: false,
        inventoryId: `0x${"0".repeat(64)}`,
        inventoryIndex: 0
      }),
      readBatch: async () => ({ nextFulfillIndex: 0 }),
      previewDraw: async () => ({ inventoryIndex: 0 }),
      submitFulfillment: async () => {
        throw new Error("RPC connection closed");
      }
    }),
    /RPC connection closed/
  );

  assert.equal(releaseCount, 0);
});

test("a stale Keeper lease is replaced with an ETag guard", async () => {
  const calls = [];
  let putAttempts = 0;
  const acquired = await acquireFulfillmentLease(
    "keeper-leases/contract/1.json",
    {
      now: () => Date.parse("2026-07-28T03:00:00.000Z"),
      operations: {
        put: async () => {
          calls.push("put");
          putAttempts += 1;
          if (putAttempts === 1) throw new Error("already exists");
          return { etag: "new-lease-etag" };
        },
        head: async () => ({
          etag: "lease-etag",
          uploadedAt: new Date("2026-07-28T02:57:00.000Z")
        }),
        del: async (_pathname, options) => {
          calls.push(`del:${options.ifMatch}`);
        }
      }
    }
  );

  assert.deepEqual(acquired, { etag: "new-lease-etag" });
  assert.deepEqual(calls, ["put", "del:lease-etag", "put"]);
});

test("lease renewal and release are fenced by the current ETag", async () => {
  const calls = [];
  const renewed = await renewFulfillmentLease(
    "keeper-leases/contract/1.json",
    { etag: "owner-etag" },
    {
      operations: {
        put: async (_pathname, _body, options) => {
          calls.push(`renew:${options.ifMatch}`);
          return { etag: "renewed-etag" };
        }
      }
    }
  );
  await releaseFulfillmentLease(
    "keeper-leases/contract/1.json",
    renewed,
    {
      del: async (_pathname, options) => {
        calls.push(`release:${options.ifMatch}`);
      }
    }
  );

  assert.deepEqual(renewed, { etag: "renewed-etag" });
  assert.deepEqual(calls, [
    "renew:owner-etag",
    "release:renewed-etag"
  ]);
});

test("the API accepts only positive integer request IDs", () => {
  assert.equal(parseFulfillmentRequest({ requestId: "12" }), 12n);
  assert.throws(() => parseFulfillmentRequest({ requestId: "0" }), /request id/i);
  assert.throws(() => parseFulfillmentRequest({ requestId: "1.5" }), /request id/i);
  assert.throws(() => parseFulfillmentRequest({}), /request id/i);
});

test("keeper recovery uses a dedicated key instead of the deployer key", async () => {
  const source = await readFile(
    new URL("../scripts/giwa/fulfill-pull.mjs", import.meta.url),
    "utf8"
  );

  assert.match(source, /GIWA_KEEPER_PRIVATE_KEY/);
  assert.doesNotMatch(source, /GIWA_DEPLOYER_PRIVATE_KEY/);
});

test("the Keeper returns after broadcasting instead of waiting for a receipt", async () => {
  const source = await readFile(
    new URL("../server/giwa/fulfillRequest.mjs", import.meta.url),
    "utf8"
  );

  assert.doesNotMatch(source, /waitForTransactionReceipt/);
});

test("recovery processes only the next requested Debut draw", () => {
  assert.equal(
    getNextPendingRequestId({
      nextDrawIndex: 5,
      nextFulfillIndex: 3
    }),
    4n
  );
  assert.equal(
    getNextPendingRequestId({
      nextDrawIndex: 5,
      nextFulfillIndex: 5
    }),
    undefined
  );
});

test("the recovery endpoint requires Vercel Cron authorization", () => {
  const environment = { CRON_SECRET: "cron-secret-value" };

  assert.equal(
    isAuthorizedCronRequest(
      { headers: { authorization: "Bearer cron-secret-value" } },
      environment
    ),
    true
  );
  assert.equal(
    isAuthorizedCronRequest(
      { headers: { authorization: "Bearer wrong" } },
      environment
    ),
    false
  );
  assert.equal(
    isAuthorizedCronRequest(
      { headers: { authorization: "Bearer cron-secret-value" } },
      {}
    ),
    false
  );
});

test("Vercel schedules one idempotent Keeper recovery each minute", async () => {
  const config = JSON.parse(await readFile(
    new URL("../vercel.json", import.meta.url),
    "utf8"
  ));

  assert.deepEqual(config.crons, [{
    path: "/api/giwa/recover",
    schedule: "* * * * *"
  }]);
  assert.equal(
    config.functions["api/giwa/recover.mjs"].includeFiles,
    "server/giwa/manifests/**"
  );
});
