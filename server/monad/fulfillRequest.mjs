import {
  createPublicClient,
  createWalletClient,
  http,
  encodeFunctionData,
  isAddress,
  isHex
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {
  acquireFulfillmentLease,
  createFulfillmentLeaseKey,
  releaseFulfillmentLease,
  renewFulfillmentLease
} from "./fulfillmentLease.mjs";
import { assertMonadTestnet, getMonadTestnetChain } from "./monadTestnetChain.mjs";
import { loadDefaultBatchManifest } from "./manifestStore.mjs";
import { packBatchAbi } from "../giwa/packBatchAbi.mjs";

export { fulfillPullRequest } from "../giwa/fulfillRequest.mjs";
import { fulfillPullRequest } from "../giwa/fulfillRequest.mjs";

export async function fulfillMonadPullFromEnvironment(
  requestId,
  environment = process.env
) {
  const contractAddress = environment.MONAD_PACK_BATCH_ADDRESS;
  const privateKey = environment.MONAD_KEEPER_PRIVATE_KEY;
  const encryptionKey = environment.MONAD_BATCH_MANIFEST_KEY;
  const rpcUrl =
    environment.MONAD_TESTNET_RPC_URL ?? "https://testnet-rpc.monad.xyz";

  if (!isAddress(contractAddress) || !isBytes32(privateKey) || !encryptionKey
    || !environment.BLOB_READ_WRITE_TOKEN) {
    throw new Error("Monad Keeper is not configured");
  }

  const chain = getMonadTestnetChain(rpcUrl);
  const account = privateKeyToAccount(privateKey);
  const publicClient = createPublicClient({ chain, transport: http(rpcUrl) });
  const walletClient = createWalletClient({
    account,
    chain,
    transport: http(rpcUrl)
  });
  await assertMonadTestnet(publicClient);
  const readPull = async (pullRequestId) => {
    const pull = await publicClient.readContract({
      address: contractAddress,
      abi: packBatchAbi,
      functionName: "getPull",
      args: [pullRequestId]
    });
    return {
      batchId: pull[1],
      drawIndex: pull[3],
      inventoryId: pull[4],
      inventoryIndex: pull[5],
      fulfilled: pull[6]
    };
  };
  const manifest = await loadDefaultBatchManifest(encryptionKey);
  const leaseKey = createFulfillmentLeaseKey(contractAddress, requestId);

  return fulfillPullRequest({
    acquireLease: () => acquireFulfillmentLease(leaseKey),
    manifest,
    requestId,
    readPull,
    readBatch: async (batchId) => {
      const batch = await publicClient.readContract({
        address: contractAddress,
        abi: packBatchAbi,
        functionName: "getBatch",
        args: [batchId]
      });
      return { nextFulfillIndex: batch[8] };
    },
    previewDraw: async ({ batchId, requestId: id, serverSeed, seedProof }) => {
      const preview = await publicClient.readContract({
        address: contractAddress,
        abi: packBatchAbi,
        functionName: "previewDraw",
        args: [batchId, id, serverSeed, seedProof]
      });
      return { inventoryIndex: preview[1] };
    },
    prepareFulfillment: async ({ requestId: id, serverSeed, seedProof, inventoryId, inventoryProof }) => {
      const transaction = await walletClient.prepareTransactionRequest({
        to: contractAddress,
        data: encodeFunctionData({
          abi: packBatchAbi,
          functionName: "fulfillPull",
          args: [id, serverSeed, seedProof, inventoryId, inventoryProof]
        })
      });
      return account.signTransaction({ ...transaction, chainId: chain.id });
    },
    submitFulfillment: (serializedTransaction) => walletClient.sendRawTransaction({ serializedTransaction }),
    releaseLease: (_id, lease) => releaseFulfillmentLease(leaseKey, lease),
    renewLease: (_id, lease) => renewFulfillmentLease(leaseKey, lease)
  });
}

function isBytes32(value) {
  return typeof value === "string" && isHex(value) && value.length === 66;
}
