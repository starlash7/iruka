import { readFile } from "node:fs/promises";
import {
  createPublicClient,
  createWalletClient,
  http,
  isAddress,
  isHex,
  keccak256
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

const [manifestPath] = process.argv.slice(2);
const contractAddress = process.env.GIWA_PACK_BATCH_ADDRESS;
const privateKey = process.env.GIWA_DEPLOYER_PRIVATE_KEY;
const serverSeed = process.env.GIWA_SERVER_SEED;

if (!manifestPath || !isAddress(contractAddress) || !isBytes32(privateKey) || !isBytes32(serverSeed)) {
  throw new Error(
    "Set GIWA_PACK_BATCH_ADDRESS, GIWA_DEPLOYER_PRIVATE_KEY, GIWA_SERVER_SEED and pass <manifest-json>."
  );
}

const chain = getGiwaSepoliaChain();
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const account = privateKeyToAccount(privateKey);
const publicClient = createPublicClient({ chain, transport: http() });
const walletClient = createWalletClient({ account, chain, transport: http() });
const transactionHash = await walletClient.writeContract({
  address: contractAddress,
  abi: packBatchAbi,
  functionName: "commitBatch",
  args: [
    manifest.batchId,
    manifest.totalSupply,
    BigInt(manifest.priceWei),
    manifest.inventoryRoot,
    manifest.oddsCommitment,
    keccak256(serverSeed)
  ]
});

await publicClient.waitForTransactionReceipt({ hash: transactionHash });
console.log(`Committed ${manifest.batchLabel} on GIWA Sepolia.`);
console.log(`https://sepolia-explorer.giwa.io/tx/${transactionHash}`);

function getGiwaSepoliaChain() {
  return {
    id: 91342,
    name: "GIWA Sepolia",
    nativeCurrency: { decimals: 18, name: "Ether", symbol: "ETH" },
    rpcUrls: { default: { http: [process.env.GIWA_TESTNET_RPC_URL ?? "https://sepolia-rpc.giwa.io"] } }
  };
}

function isBytes32(value) {
  return typeof value === "string" && isHex(value) && value.length === 66;
}

const packBatchAbi = [
  {
    type: "function",
    name: "commitBatch",
    stateMutability: "nonpayable",
    inputs: [
      { name: "batchId", type: "bytes32" },
      { name: "totalSupply", type: "uint32" },
      { name: "priceWei", type: "uint256" },
      { name: "inventoryRoot", type: "bytes32" },
      { name: "oddsCommitment", type: "bytes32" },
      { name: "serverSeedCommitment", type: "bytes32" }
    ],
    outputs: []
  }
];
