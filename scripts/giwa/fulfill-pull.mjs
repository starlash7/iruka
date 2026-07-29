import { readFile } from "node:fs/promises";
import {
  createPublicClient,
  createWalletClient,
  http,
  isAddress,
  isHex
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

const packBatchAbi = [
  {
    type: "function",
    name: "getPull",
    stateMutability: "view",
    inputs: [{ name: "requestId", type: "uint64" }],
    outputs: [
      { name: "collector", type: "address" },
      { name: "batchId", type: "bytes32" },
      { name: "clientSeed", type: "bytes32" },
      { name: "drawIndex", type: "uint32" },
      { name: "inventoryId", type: "bytes32" },
      { name: "inventoryIndex", type: "uint32" },
      { name: "fulfilled", type: "bool" }
    ]
  },
  {
    type: "function",
    name: "previewDraw",
    stateMutability: "view",
    inputs: [
      { name: "batchId", type: "bytes32" },
      { name: "requestId", type: "uint64" },
      { name: "serverSeed", type: "bytes32" },
      { name: "seedProof", type: "bytes32[]" }
    ],
    outputs: [
      { name: "position", type: "uint32" },
      { name: "inventoryIndex", type: "uint32" }
    ]
  },
  {
    type: "function",
    name: "fulfillPull",
    stateMutability: "nonpayable",
    inputs: [
      { name: "requestId", type: "uint64" },
      { name: "serverSeed", type: "bytes32" },
      { name: "seedProof", type: "bytes32[]" },
      { name: "inventoryId", type: "bytes32" },
      { name: "inventoryProof", type: "bytes32[]" }
    ],
    outputs: []
  }
];

const [manifestPath, requestIdInput] = process.argv.slice(2);
const contractAddress = process.env.GIWA_PACK_BATCH_ADDRESS;
const privateKey = process.env.GIWA_KEEPER_PRIVATE_KEY;

if (!manifestPath || !requestIdInput || !isAddress(contractAddress) || !isBytes32(privateKey)) {
  throw new Error(
    "Set GIWA_PACK_BATCH_ADDRESS, GIWA_KEEPER_PRIVATE_KEY and pass <manifest-json> <request-id>."
  );
}

const requestId = BigInt(requestIdInput);
const chain = {
  id: 91342,
  name: "GIWA Sepolia",
  nativeCurrency: { decimals: 18, name: "Ether", symbol: "ETH" },
  rpcUrls: {
    default: {
      http: [process.env.GIWA_TESTNET_RPC_URL ?? "https://sepolia-rpc.giwa.io"]
    }
  }
};
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const account = privateKeyToAccount(privateKey);
const publicClient = createPublicClient({ chain, transport: http() });
const walletClient = createWalletClient({ account, chain, transport: http() });
const pull = await publicClient.readContract({
  address: contractAddress,
  abi: packBatchAbi,
  functionName: "getPull",
  args: [requestId]
});
const [, batchId, , drawIndex, , , fulfilled] = pull;

if (batchId !== manifest.batchId) {
  throw new Error("The request does not belong to the provided batch manifest.");
}
if (fulfilled) throw new Error("The request is already fulfilled.");

const drawSeed = manifest.drawSeeds[Number(drawIndex)];
if (!drawSeed || drawSeed.drawIndex !== Number(drawIndex)) {
  throw new Error(`Draw seed ${drawIndex} is not in the manifest.`);
}

const [, inventoryIndex] = await publicClient.readContract({
  address: contractAddress,
  abi: packBatchAbi,
  functionName: "previewDraw",
  args: [manifest.batchId, requestId, drawSeed.seed, drawSeed.proof]
});
const inventory = manifest.inventory[Number(inventoryIndex)];

if (!inventory) throw new Error(`Inventory index ${inventoryIndex} is not in the manifest.`);

const transactionHash = await walletClient.writeContract({
  address: contractAddress,
  abi: packBatchAbi,
  functionName: "fulfillPull",
  args: [
    requestId,
    drawSeed.seed,
    drawSeed.proof,
    inventory.inventoryId,
    inventory.proof
  ]
});

const receipt = await publicClient.waitForTransactionReceipt({ hash: transactionHash });
if (receipt.status !== "success") {
  throw new Error(`Pull fulfillment reverted: ${transactionHash}`);
}
console.log(`Fulfilled request ${requestId} for ${inventory.id}`);
console.log(`https://sepolia-explorer.giwa.io/tx/${transactionHash}`);

function isBytes32(value) {
  return typeof value === "string" && isHex(value) && value.length === 66;
}
