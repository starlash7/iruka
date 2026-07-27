import {
  createPublicClient,
  createWalletClient,
  http,
  isAddress,
  isHex
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { loadBatchManifest } from "./manifestStore.mjs";
import { packBatchAbi } from "./packBatchAbi.mjs";

export async function fulfillPullRequest({
  manifest,
  requestId,
  previewDraw,
  readBatch,
  readPull,
  submitFulfillment
}) {
  const pull = await readPull(requestId);
  assertMatchingBatch(pull.batchId, manifest.batchId);

  if (pull.fulfilled) return getFulfilledResult(pull);

  const batch = await readBatch(pull.batchId);
  if (pull.drawIndex !== batch.nextFulfillIndex) {
    return {
      status: "pending",
      nextFulfillIndex: batch.nextFulfillIndex
    };
  }

  const drawSeed = manifest.drawSeeds[pull.drawIndex];
  if (!drawSeed || drawSeed.drawIndex !== pull.drawIndex) {
    throw new Error(`Draw seed ${pull.drawIndex} is not in the manifest`);
  }

  const preview = await previewDraw({
    batchId: pull.batchId,
    requestId,
    seedProof: drawSeed.proof,
    serverSeed: drawSeed.seed
  });
  const inventory = manifest.inventory[preview.inventoryIndex];
  if (!inventory || inventory.index !== preview.inventoryIndex) {
    throw new Error(
      `Inventory index ${preview.inventoryIndex} is not in the manifest`
    );
  }

  try {
    const transactionHash = await submitFulfillment({
      inventoryId: inventory.inventoryId,
      inventoryProof: inventory.proof,
      requestId,
      seedProof: drawSeed.proof,
      serverSeed: drawSeed.seed
    });
    return {
      status: "submitted",
      transactionHash,
      inventoryId: inventory.inventoryId,
      inventoryIndex: inventory.index
    };
  } catch (error) {
    const latestPull = await readPull(requestId);
    if (latestPull.fulfilled) return getFulfilledResult(latestPull);
    throw error;
  }
}

export async function fulfillGiwaPullFromEnvironment(
  requestId,
  environment = process.env
) {
  const contractAddress = environment.GIWA_PACK_BATCH_ADDRESS;
  const privateKey = environment.GIWA_KEEPER_PRIVATE_KEY;
  const encryptionKey = environment.GIWA_BATCH_MANIFEST_KEY;
  const rpcUrl =
    environment.GIWA_TESTNET_RPC_URL ?? "https://sepolia-rpc.giwa.io";

  if (!isAddress(contractAddress) || !isBytes32(privateKey) || !encryptionKey) {
    throw new Error("GIWA Keeper is not configured");
  }

  const chain = getGiwaSepoliaChain(rpcUrl);
  const account = privateKeyToAccount(privateKey);
  const publicClient = createPublicClient({ chain, transport: http(rpcUrl) });
  const walletClient = createWalletClient({
    account,
    chain,
    transport: http(rpcUrl)
  });
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
  const initialPull = await readPull(requestId);
  const manifest = await loadBatchManifest(
    initialPull.batchId,
    encryptionKey
  );

  return fulfillPullRequest({
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
    submitFulfillment: async ({
      requestId: id,
      serverSeed,
      seedProof,
      inventoryId,
      inventoryProof
    }) => {
      const transactionHash = await walletClient.writeContract({
        address: contractAddress,
        abi: packBatchAbi,
        functionName: "fulfillPull",
        args: [id, serverSeed, seedProof, inventoryId, inventoryProof]
      });
      return transactionHash;
    }
  });
}

function getFulfilledResult(pull) {
  return {
    status: "fulfilled",
    inventoryId: pull.inventoryId,
    inventoryIndex: pull.inventoryIndex
  };
}

function assertMatchingBatch(actual, expected) {
  if (actual.toLowerCase() !== expected.toLowerCase()) {
    throw new Error("The request does not match the batch manifest");
  }
}

function isBytes32(value) {
  return typeof value === "string" && isHex(value) && value.length === 66;
}

function getGiwaSepoliaChain(rpcUrl) {
  return {
    id: 91342,
    name: "GIWA Sepolia",
    nativeCurrency: { decimals: 18, name: "Ether", symbol: "ETH" },
    rpcUrls: { default: { http: [rpcUrl] } }
  };
}
