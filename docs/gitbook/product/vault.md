# Vault

The Iruka vault is the custody layer for pulled and marketplace-listed collectibles.

## What the Vault Does

The vault stores verified physical items while users keep digital control over marketplace decisions.

Vaulted items can be:

- Held in storage
- Listed on the marketplace
- Sold
- Queued for redemption and shipping

## Vault Item Fields

A production vault item should include:

- Item ID
- Pack ID
- Category
- Rarity
- Serial
- Item name
- Group, set, or collection name when needed for identification
- Estimated value
- Buyback or exit value when supported
- Custody status
- Redemption eligibility
- Shipping status

## Vault Statuses

| Status | Meaning |
| --- | --- |
| Vaulted | Stored and available for future actions |
| Listed | Listed on the marketplace |
| Sold | Sold through a marketplace or exit flow |
| Redeem queued | User requested shipment |

## Custody Principle

Iruka should only show an item as vaulted when there is an internal record proving custody, verification, and redemption eligibility.

