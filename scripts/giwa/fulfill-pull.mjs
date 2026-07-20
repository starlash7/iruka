import { readFile } from "node:fs/promises";
import {
  createPublicClient,
  createWalletClient,
  decodeFunctionData,
  http,
  isAddress,
  isHex
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

const [manifestPath, requestIdInput, revealTransactionHash] = process.argv.slice(2);
const contractAddress = process.env.GIWA_PACK_BATCH_ADDRESS;
const privateKey = process.env.GIWA_DEPLOYER_PRIVATE_KEY;
const serverSeed = process.env.GIWA_SERVER_SEED;
const requestId = BigInt(requestIdInput);

if (!manifestPath || !requestIdInput || !isHex(revealTransactionHash) || !isAddress(contractAddress) || !isBytes32(serverSeed) || !isBytes32(privateKey)) {
  throw new Error(
    "Set GIWA_PACK_BATCH_ADDRESS, GIWA_DEPLOYER_PRIVATE_KEY, GIWA_SERVER_SEED and pass <manifest-json> <request-id> <reveal-transaction-hash>."
  );
}

const chain = {
  id: 91342,
  name: "GIWA Sepolia",
  nativeCurrency: { decimals: 18, name: "Ether", symbol: "ETH" },
  rpcUrls: { default: { http: [process.env.GIWA_TESTNET_RPC_URL ?? "https://sepolia-rpc.giwa.io"] } }
};
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const account = privateKeyToAccount(privateKey);
const publicClient = createPublicClient({ chain, transport: http() });
const walletClient = createWalletClient({ account, chain, transport: http() });
const revealTransaction = await publicClient.getTransaction({ hash: revealTransactionHash });
const decodedReveal = decodeFunctionData({ abi: packBatchAbi, data: revealTransaction.input });

if (decodedReveal.functionName !== "revealClientSeed") {
  throw new Error("The provided transaction is not a revealClientSeed call.");
}
if (decodedReveal.args[0] !== requestId) {
  throw new Error("The reveal transaction does not match the requested pull.");
}
const [, inventoryIndex] = await publicClient.readContract({
  address: contractAddress,
  abi: packBatchAbi,
  functionName: "previewDraw",
  args: [manifest.batchId, requestId, serverSeed]
});
const inventory = manifest.inventory[Number(inventoryIndex)];

if (!inventory) throw new Error(`Inventory index ${inventoryIndex} is not in the manifest.`);

const transactionHash = await walletClient.writeContract({
  address: contractAddress,
  abi: packBatchAbi,
  functionName: "fulfillPull",
  args: [requestId, serverSeed, inventory.inventoryId, inventory.proof]
});

await publicClient.waitForTransactionReceipt({ hash: transactionHash });
console.log(`Fulfilled request ${requestId} for ${inventory.id}`);
console.log(`https://sepolia-explorer.giwa.io/tx/${transactionHash}`);

function isBytes32(value) {
  return typeof value === "string" && isHex(value) && value.length === 66;
}

const packBatchAbi = [
  {
    type: "function",
    name: "revealClientSeed",
    stateMutability: "nonpayable",
    inputs: [
      { name: "requestId", type: "uint64" },
      { name: "clientSeed", type: "bytes32" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "previewDraw",
    stateMutability: "view",
    inputs: [
      { name: "batchId", type: "bytes32" },
      { name: "requestId", type: "uint64" },
      { name: "serverSeed", type: "bytes32" }
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
      { name: "inventoryId", type: "bytes32" },
      { name: "proof", type: "bytes32[]" }
    ],
    outputs: []
  }
];
