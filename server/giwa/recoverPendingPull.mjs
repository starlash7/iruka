import {
  createPublicClient,
  http,
  isAddress
} from "viem";
import { fulfillGiwaPullFromEnvironment } from "./fulfillRequest.mjs";
import { getGiwaSepoliaChain } from "./giwaSepoliaChain.mjs";
import { loadDefaultBatchManifest } from "./manifestStore.mjs";
import { packBatchAbi } from "./packBatchAbi.mjs";

export function getNextPendingRequestId({
  nextDrawIndex,
  nextFulfillIndex
}) {
  if (nextFulfillIndex >= nextDrawIndex) return undefined;

  // Debut is the only committed batch, so draw and global request order match.
  return BigInt(nextFulfillIndex) + 1n;
}

export async function recoverNextGiwaPullFromEnvironment(
  environment = process.env
) {
  const contractAddress = environment.GIWA_PACK_BATCH_ADDRESS;
  const encryptionKey = environment.GIWA_BATCH_MANIFEST_KEY;
  const rpcUrl =
    environment.GIWA_TESTNET_RPC_URL ?? "https://sepolia-rpc.giwa.io";

  if (!isAddress(contractAddress) || !encryptionKey) {
    throw new Error("GIWA Keeper recovery is not configured");
  }

  const manifest = await loadDefaultBatchManifest(encryptionKey);
  const publicClient = createPublicClient({
    chain: getGiwaSepoliaChain(rpcUrl),
    transport: http(rpcUrl)
  });
  const batch = await publicClient.readContract({
    address: contractAddress,
    abi: packBatchAbi,
    functionName: "getBatch",
    args: [manifest.batchId]
  });
  const requestId = getNextPendingRequestId({
    nextDrawIndex: batch[7],
    nextFulfillIndex: batch[8]
  });

  if (!requestId) return { status: "idle" };
  return fulfillGiwaPullFromEnvironment(requestId, environment);
}
