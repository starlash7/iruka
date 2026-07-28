import {
  BlobNotFoundError,
  BlobPreconditionFailedError,
  del,
  head,
  put
} from "@vercel/blob";

const DEFAULT_LEASE_DURATION_MS = 120_000;
const blobOperations = { del, head, put };

export function createFulfillmentLeaseKey(contractAddress, requestId) {
  return `keeper-leases/${contractAddress.toLowerCase()}/${requestId}.json`;
}

export async function acquireFulfillmentLease(
  pathname,
  {
    leaseDurationMs = DEFAULT_LEASE_DURATION_MS,
    now = Date.now,
    operations = blobOperations
  } = {}
) {
  try {
    return await createLease(pathname, now, operations);
  } catch (putError) {
    let currentLease;
    try {
      currentLease = await operations.head(pathname);
    } catch (headError) {
      if (headError instanceof BlobNotFoundError) throw putError;
      throw headError;
    }

    const age = now() - new Date(currentLease.uploadedAt).getTime();
    if (age < leaseDurationMs) return undefined;

    try {
      await operations.del(pathname, { ifMatch: currentLease.etag });
    } catch (deleteError) {
      if (
        deleteError instanceof BlobNotFoundError
        || deleteError instanceof BlobPreconditionFailedError
      ) {
        return undefined;
      }
      throw deleteError;
    }

    try {
      return await createLease(pathname, now, operations);
    } catch (retryError) {
      try {
        await operations.head(pathname);
        return undefined;
      } catch {
        throw retryError;
      }
    }
  }
}

export async function renewFulfillmentLease(
  pathname,
  lease,
  {
    now = Date.now,
    operations = blobOperations
  } = {}
) {
  try {
    const renewed = await operations.put(
      pathname,
      JSON.stringify({ acquiredAt: new Date(now()).toISOString() }),
      {
        access: "private",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "application/json",
        ifMatch: lease.etag
      }
    );
    return { etag: renewed.etag };
  } catch (error) {
    if (
      error instanceof BlobNotFoundError
      || error instanceof BlobPreconditionFailedError
    ) {
      return undefined;
    }
    throw error;
  }
}

export async function releaseFulfillmentLease(
  pathname,
  lease,
  operations = blobOperations
) {
  try {
    await operations.del(pathname, { ifMatch: lease.etag });
  } catch (error) {
    if (
      !(error instanceof BlobNotFoundError)
      && !(error instanceof BlobPreconditionFailedError)
    ) {
      throw error;
    }
  }
}

async function createLease(pathname, now, operations) {
  const lease = await operations.put(
    pathname,
    JSON.stringify({ acquiredAt: new Date(now()).toISOString() }),
    {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: false,
      contentType: "application/json"
    }
  );
  return { etag: lease.etag };
}
