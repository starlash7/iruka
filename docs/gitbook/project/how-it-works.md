# How Iruka Works

Iruka has four core flows.

## 1. Pull

Users choose an active pack and pull one item from that pack. Each pack shows:

- Pack price
- Remaining supply
- Rarity tiers
- Odds
- Estimated value bands

## 2. Reveal

After the pull, the user sees the revealed card or collectible item. The revealed item includes:

- Rarity
- Serial
- Category
- Estimated value
- Vault status

## 3. Vault

The item can stay in verified storage. Vaulted items remain available for marketplace actions without requiring immediate shipping.

## 4. Exit

Users can choose an exit path:

- Keep vaulted
- List or sell
- Request shipment

The MVP models these actions in the frontend. Production flows should connect these actions to inventory records, custody status, settlement, and shipping operations.

