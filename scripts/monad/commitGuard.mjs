import { parseAbiItem } from "viem";

const batchCommittedEvent = parseAbiItem("event BatchCommitted(bytes32 indexed batchId, uint32 totalSupply, uint256 priceWei, bytes32 inventoryRoot, bytes32 oddsCommitment, bytes32 drawSeedRoot)");

export async function assertFreshMonadContract(publicClient, address, deploymentHash) {
  const receipt = await publicClient.getTransactionReceipt({hash: deploymentHash});
  if (receipt.status !== "success" || receipt.contractAddress?.toLowerCase() !== address.toLowerCase()) {
    throw new Error("Monad contract must match the successful deployment receipt");
  }
  const latest = await publicClient.getBlockNumber();
  // Monad RPCs enforce small log ranges; scan only this fresh contract's lifetime.
  for (let fromBlock = receipt.blockNumber; fromBlock <= latest; fromBlock += 100n) {
    const toBlock = fromBlock + 99n < latest ? fromBlock + 99n : latest;
    const commitments = await publicClient.getLogs({address, event: batchCommittedEvent, fromBlock, toBlock});
    if (commitments.length > 0) {
      throw new Error("Monad recovery requires one fresh contract with exactly one batch");
    }
  }
}
