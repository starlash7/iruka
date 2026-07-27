# Automatic Pull Fulfillment Design

## Goal

Make every GIWA Sepolia pull complete after one collector transaction without
requiring the deployment wallet to manually run `fulfill-pull.mjs`.

## Architecture

Iruka keeps the existing committed per-draw server seeds, client seed mixing,
inventory Merkle proofs, and without-replacement draw order. A dedicated
low-balance Keeper account receives permission to call `fulfillPull`, while the
contract owner keeps batch, withdrawal, and Keeper-management authority.

After `requestPull` confirms, the browser calls a same-origin fulfillment
endpoint and continues polling the original request. The endpoint decrypts the
private batch manifest, validates the request against the configured contract,
and submits the committed proof with the Keeper account. Repeated calls are
idempotent: fulfilled requests return their existing result and out-of-order
requests remain pending until earlier draws complete.

## Contract Roles

- `owner`: commits batches, updates the Keeper, and withdraws test payments.
- `operator`: calls `fulfillPull` and has no batch or withdrawal authority.
- `collector`: submits one payable `requestPull` transaction.

The owner and operator must be different production accounts. A zero operator
is rejected, and operator changes emit an onchain event.

## Keeper Data

Private server seeds remain encrypted at rest. The repository contains only an
AES-256-GCM encrypted batch manifest; the decryption key and Keeper private key
are Vercel secrets. The Keeper private key is dedicated to GIWA Sepolia and
holds only enough test ETH for fulfillment gas.

## Failure Handling

- A repeated request never creates a second pull.
- A repeated Keeper call for a fulfilled request returns the existing state.
- An out-of-order request returns pending and is retried while the browser
  checks the same request.
- RPC, Keeper, or manifest errors leave the request recoverable through
  `Check result`; they do not fabricate a result.
- The browser reveals only after `PullFulfilled` and inventory commitment
  verification succeed.

## Current Scope

This is a GIWA Sepolia review implementation. It does not claim VRF, mainnet
settlement, production custody, or a production SLA. A managed queue,
rate-limiting, monitoring, refunds, and audited key management remain required
before commercial operation.
