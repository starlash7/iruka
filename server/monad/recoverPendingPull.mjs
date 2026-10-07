import {
  createPublicClient,
  http,
  isAddress
} from "viem";
import { fulfillMonadPullFromEnvironment } from "./fulfillRequest.mjs";
import { assertMonadTestnet, getMonadTestnetChain } from "./monadTestnetChain.mjs";
import { loadDefaultBatchManifest } from "./manifestStore.mjs";
import { packBatchAbi } from "../giwa/packBatchAbi.mjs";

export function getNextPendingRequestId({
  nextDrawIndex,
  nextFulfillIndex
}) {
  if (nextFulfillIndex >= nextDrawIndex) return undefined;

  // Debut is the only committed batch, so draw and global request order match.
  return BigInt(nextFulfillIndex) + 1n;
}

export async function recoverNextMonadPullFromEnvironment(
  environment = process.env
) {
  const contractAddress = environment.MONAD_PACK_BATCH_ADDRESS;
  const encryptionKey = environment.MONAD_BATCH_MANIFEST_KEY;
  const rpcUrl =
    environment.MONAD_TESTNET_RPC_URL ?? "https://testnet-rpc.monad.xyz";

  if (!isAddress(contractAddress) || !encryptionKey || !environment.MONAD_KEEPER_PRIVATE_KEY
    || !environment.BLOB_READ_WRITE_TOKEN) {
    throw new Error("Monad Keeper recovery is not configured");
  }

  const manifest = await loadDefaultBatchManifest(encryptionKey);
  const publicClient = createPublicClient({
    chain: getMonadTestnetChain(rpcUrl),
    transport: http(rpcUrl)
  });
  await assertMonadTestnet(publicClient);
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
  return fulfillMonadPullFromEnvironment(requestId, environment);
}
