export {
  acquireFulfillmentLease,
  releaseFulfillmentLease,
  renewFulfillmentLease
} from "../giwa/fulfillmentLease.mjs";

export function createFulfillmentLeaseKey(contractAddress, requestId) {
  return `keeper-leases/10143/${contractAddress.toLowerCase()}/${requestId}.json`;
}
