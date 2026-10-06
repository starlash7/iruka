import { assertFreshMonadContract } from "./commitGuard.mjs";
import { readFile } from "node:fs/promises";
import {
  createPublicClient,
  createWalletClient,
  http,
  isAddress,
  isHex
} from "viem";
import { assertMonadBatchManifest } from "../../server/monad/manifestStore.mjs";
import { assertMonadTestnet, getMonadTestnetChain } from "../../server/monad/monadTestnetChain.mjs";
import { privateKeyToAccount } from "viem/accounts";

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
      { name: "drawSeedRoot", type: "bytes32" }
    ],
    outputs: []
  }
];

const [manifestPath, deploymentHash] = process.argv.slice(2);
const contractAddress = process.env.MONAD_PACK_BATCH_ADDRESS;
const privateKey = process.env.MONAD_DEPLOYER_PRIVATE_KEY;

if (!manifestPath || !isBytes32(deploymentHash) || !isAddress(contractAddress) || !isBytes32(privateKey)) {
  throw new Error(
    "Set MONAD_PACK_BATCH_ADDRESS, MONAD_DEPLOYER_PRIVATE_KEY and pass <manifest-json> <deployment-tx-hash>."
  );
}

const chain = getMonadTestnetChain(process.env.MONAD_TESTNET_RPC_URL);
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const account = privateKeyToAccount(privateKey);
const publicClient = createPublicClient({ chain, transport: http() });
const walletClient = createWalletClient({ account, chain, transport: http() });
assertMonadBatchManifest(manifest);
await assertMonadTestnet(publicClient);
await assertFreshMonadContract(publicClient, contractAddress, deploymentHash);
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
    manifest.drawSeedRoot
  ]
});

const receipt = await publicClient.waitForTransactionReceipt({ hash: transactionHash });
if (receipt.status !== "success") {
  throw new Error(`Batch commit reverted: ${transactionHash}`);
}
console.log(`Committed ${manifest.batchLabel} on Monad Testnet.`);
console.log(`https://testnet.monadvision.com/tx/${transactionHash}`);

function isBytes32(value) {
  return typeof value === "string" && isHex(value) && value.length === 66;
}
