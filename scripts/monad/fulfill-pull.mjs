import { createPublicClient, http } from "viem";
import { fulfillMonadPullFromEnvironment } from "../../server/monad/fulfillRequest.mjs";
import { getMonadTestnetChain, MONAD_EXPLORER_URL } from "../../server/monad/monadTestnetChain.mjs";
import { parseFulfillmentRequest } from "../../api/monad/fulfill.mjs";

const [requestIdInput] = process.argv.slice(2);
if (!requestIdInput || !process.env.MONAD_KEEPER_PRIVATE_KEY) {
  throw new Error("Set MONAD Keeper credentials and pass <request-id>; uses the deployed encrypted manifest and shared Blob lease.");
}
const requestId = parseFulfillmentRequest({requestId: requestIdInput});
const result = await fulfillMonadPullFromEnvironment(requestId);
if (result.status === "submitted") {
  const publicClient = createPublicClient({
    chain: getMonadTestnetChain(process.env.MONAD_TESTNET_RPC_URL),
    transport: http()
  });
  const receipt = await publicClient.waitForTransactionReceipt({hash: result.transactionHash});
  if (receipt.status !== "success") throw new Error(`Pull fulfillment reverted: ${result.transactionHash}`);
  console.log(`Confirmed request ${requestId}: ${MONAD_EXPLORER_URL}/tx/${result.transactionHash}`);
} else {
  console.log(JSON.stringify(result));
}
