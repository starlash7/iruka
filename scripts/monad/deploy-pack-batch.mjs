import { readFile } from "node:fs/promises";
import { createPublicClient, createWalletClient, http, isAddress, isHex, parseAbi, zeroAddress } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { assertMonadTestnet, getMonadTestnetChain, MONAD_EXPLORER_URL } from "../../server/monad/monadTestnetChain.mjs";
import { compileMonadContract, verifyMonadContract } from "./deploymentForge.mjs";

const privateKey = process.env.MONAD_DEPLOYER_PRIVATE_KEY;
const operator = process.env.IRUKA_MONAD_KEEPER_ADDRESS;
if (!isAddress(operator) || operator.toLowerCase() === zeroAddress || !isHex(privateKey) || privateKey.length !== 66) {
  throw new Error("Set MONAD_DEPLOYER_PRIVATE_KEY and IRUKA_MONAD_KEEPER_ADDRESS before Monad deployment");
}
const account = privateKeyToAccount(privateKey);
if (account.address.toLowerCase() === operator.toLowerCase()) {
  throw new Error("Use a dedicated Monad Keeper distinct from the deployer");
}
const chain = getMonadTestnetChain(process.env.MONAD_TESTNET_RPC_URL);
const publicClient = createPublicClient({chain, transport: http()});
const walletClient = createWalletClient({account, chain, transport: http()});
await assertMonadTestnet(publicClient);
await compileMonadContract();
const artifact = JSON.parse(await readFile("contracts/out/IrukaPackBatch.sol/IrukaPackBatch.json", "utf8"));
const hash = await walletClient.deployContract({abi: artifact.abi, bytecode: artifact.bytecode.object});
const receipt = await publicClient.waitForTransactionReceipt({hash});
if (receipt.status !== "success" || !receipt.contractAddress) throw new Error(`Monad deployment failed: ${hash}`);
const address = receipt.contractAddress;
// Print real provenance before subsequent steps so interrupted setup can resume.
console.log(`MONAD_PACK_BATCH_ADDRESS=${address}`);
console.log(`${MONAD_EXPLORER_URL}/tx/${hash}`);
const operatorHash = await walletClient.writeContract({
  address,
  abi: parseAbi(["function setOperator(address newOperator)"]),
  functionName: "setOperator", args: [operator]
});
const operatorReceipt = await publicClient.waitForTransactionReceipt({hash: operatorHash});
if (operatorReceipt.status !== "success") throw new Error(`Monad operator configuration reverted: ${operatorHash}`);
console.log(`${MONAD_EXPLORER_URL}/tx/${operatorHash}`);
await verifyMonadContract(address);
console.log(`Verified ${MONAD_EXPLORER_URL}/address/${address}`);
