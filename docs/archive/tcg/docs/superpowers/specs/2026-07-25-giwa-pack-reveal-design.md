# GIWA Pack Receipt And Reveal Design

## Goal

Deliver a credible GIWA Sepolia review flow in which a collector requests one
pack, the committed inventory is assigned without replacement, the resulting
receipt is verifiable in the Explorer, and the card reveal follows
`sprint.md`.

This slice records pack requests, fulfillment evidence, and inventory
consumption. It does not mint an ERC-721, claim decentralized randomness, or
implement production payment settlement.

## Contract Architecture

`IrukaPackBatch` remains the single testnet contract. A batch commits:

- inventory Merkle root
- odds snapshot commitment
- one Merkle root containing a server seed for each draw position
- total supply
- testnet native-token price

Each collector sends one `requestPull` transaction with a locally generated
client seed. The contract assigns the next draw position and reserves one unit
of available supply immediately. Multiple collectors can therefore submit
requests without waiting for the previous request to be fulfilled.

The fulfillment operator processes requests in draw order. For each request it
submits:

- the precommitted server seed for that draw position
- the server-seed Merkle proof
- the selected inventory identifier
- the inventory Merkle proof

The contract combines the request's client seed, the proven server seed, and
the request identifier to select a remaining inventory position. It verifies
the selected inventory item and removes that position from the batch's
without-replacement index mapping. `PullFulfilled` is the canonical receipt.

Ordered fulfillment keeps the without-replacement mapping deterministic while
still allowing concurrent requests. This mechanism is auditable commit/reveal,
not VRF. The operator can delay fulfillment, and that limitation must remain
documented.

## Contract State

`Batch` stores:

- `totalSupply`
- `available`
- `remaining`
- `priceWei`
- `inventoryRoot`
- `oddsCommitment`
- `drawSeedRoot`
- `nextDrawIndex`
- `nextFulfillIndex`
- the existing swap mapping used for without-replacement selection

`PullRequest` stores:

- collector
- batch identifier
- client seed
- draw index
- selected inventory identifier and index after fulfillment
- fulfillment state

`requestPull` decrements `available`. `fulfillPull` decrements `remaining`.
This prevents overselling while preserving the distinction between reserved
and fulfilled packs.

## Frontend Transaction Flow

The browser:

1. switches the connected EVM wallet to GIWA Sepolia
2. reads the committed batch and its test price
3. generates a nonzero 32-byte client seed
4. submits one `requestPull` transaction
5. reads `requestId` and `drawIndex` from `PullRequested`
6. exposes only the real request transaction in the Explorer
7. polls `getPull(requestId)` until the operator fulfills the reserved draw
8. reads the matching `PullFulfilled` event and its transaction hash
9. verifies that the returned inventory commitment matches the selected
   Vending inventory index
10. reveals that exact card and links the fulfillment transaction

The current operator script fulfills the request from the generated batch
manifest. Until an operator API exists, the browser keeps the request pending
and lets the collector check the same request again. It never submits a second
request while the first is unresolved and never substitutes a local random
card for the onchain assignment.

The review Debut batch uses 100 inventory positions so uniform
without-replacement selection matches the published rarity counts exactly:
60 Common, 28 Rare, 9 Epic, 2 Legendary, and 1 Iruka.

## Reveal Architecture

The reveal uses regular DOM and CSS rather than extending the existing
real-time Three.js scene. Its state machine is:

```text
idle -> charging -> tear -> reveal -> summary
```

- `idle` is represented by the selected pack before the Pull action.
- `charging` lasts no more than 500ms.
- `tear` uses an optional pre-rendered clip only when a configured asset is
  available; otherwise it uses the CSS pack-tear fallback.
- `reveal` presents a DOM card with pointer tilt, glare, and flip.
- `summary` shows the card name, rarity, serial, estimated value, and a real
  GIWA Explorer link when one belongs to the completed result.

The first completed reveal uses the configured rarity timing. Later reveals
may use the quick path. Skip works from every overlay state and moves directly
to summary. Sound remains muted by default. Reduced-motion disables tilt,
flashing, and long transitions.

No placeholder video or audio is generated. The media adapter accepts the
paths defined in `sprint.md` when licensed assets are later supplied and
otherwise completes through the CSS fallback.

## Component Boundaries

- `revealConfig.ts`: rarity colors, maximum timing, and phase durations
- `revealMachine.ts`: pure state-transition and timing helpers
- `useRevealTimeline.ts`: React timer lifecycle, skip, quick mode, and
  completion
- `RevealCard.tsx`: DOM card flip, tilt, and glare interaction
- `RevealTear.tsx`: optional video playback and CSS fallback
- `PackRevealOverlay.tsx`: dialog composition, sound control, and summary
- `giwaPackBatch.ts`: ABI and commitment helpers
- `giwaPull.ts`: wallet transaction and Explorer receipt parsing
- `giwaFulfillment.ts`: fulfillment polling and canonical event lookup
- `giwaInventory.ts`: committed inventory ID verification and Vending result
  mapping
- `scripts/giwa/prepare-batch.mjs`: inventory and per-draw seed commitments
- `scripts/giwa/fulfill-pull.mjs`: proof selection and fulfillment transaction

The existing Vending, Vault, Sell, and Ship state remains owned by `App`.

## Error Handling

- Missing contract address keeps the existing local fixture flow.
- Wrong chain or rejected wallet transactions return the existing failure
  notice and do not open a reveal.
- A fulfillment timeout preserves the request receipt and changes the primary
  action to check that request again.
- An inventory commitment mismatch blocks the reveal and reports a result
  verification failure.
- Missing or failed reveal media switches to CSS without blocking the result.
- A testnet request that is not yet fulfilled shows only its request receipt.
- Invalid Merkle proofs, out-of-order fulfillment, incorrect payment, and
  exhausted supply revert in the contract.
- Explorer links are rendered only from transaction hashes returned by the
  connected wallet or confirmed fulfillment data.

## Verification

Contract tests must prove:

- concurrent requests reserve distinct draw positions
- available supply prevents overselling
- fulfillment must follow draw order
- server seeds must match the committed draw position
- inventory cannot be assigned twice
- `available` and `remaining` change at the correct stages

Frontend tests must prove:

- the reveal state order and rarity timing
- skip reaches summary from every active phase
- quick mode shortens later reveals
- reduced-motion uses the short fallback
- missing media leaves the CSS tear visible
- the GIWA browser request uses one wallet transaction
- the browser polls one reserved request without creating another transaction
- only a fulfilled pull with a matching inventory commitment opens Reveal
- the fulfillment Explorer link comes from `PullFulfilled`
- only real transaction hashes produce Explorer URLs

Focused contract and frontend tests run during development. A full production
build is reserved for release verification under `CLAUDE.md`.
