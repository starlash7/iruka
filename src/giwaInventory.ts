import { activeDeployment } from "./activeDeployment.ts";
import { createStoredPullReceipt } from "./pullReceiptStorage.ts";
import type { GiwaPullReceipt } from "./giwaPull.ts";
import type { GiwaPullFulfillment } from "./giwaFulfillment.ts";
import { getInventoryCommitmentId } from "./giwaPackBatch.ts";
import { getPackInventory } from "./vendingData.ts";
import type { VendingPull } from "./vendingTypes.ts";

export async function createGiwaVendingPull(
  packId: string,
  fulfillment: GiwaPullFulfillment,
  receipt?: GiwaPullReceipt
): Promise<VendingPull> {
  const inventory = await getPackInventory(packId, {
    cursor: fulfillment.inventoryIndex,
    limit: 1
  });
  const card = inventory.items[0];

  if (!card || card.packId !== packId) {
    throw new Error("GIWA inventory index is outside the selected pack");
  }
  if (
    getInventoryCommitmentId(card.id).toLowerCase()
    !== fulfillment.inventoryId.toLowerCase()
  ) {
    throw new Error("GIWA inventory commitment does not match the selected card");
  }

  return {
    ...(receipt ? { onchainReceipt: createStoredPullReceipt(receipt, fulfillment) } : {}),
    card,
    id: `${packId}-${activeDeployment.id}-${fulfillment.fulfillmentTransactionHash.slice(2, 10)}`,
    packId,
    pulledAt: new Date().toISOString()
  };
}
