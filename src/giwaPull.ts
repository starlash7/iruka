import {
  createPublicClient,
  encodeFunctionData,
  http,
  parseEventLogs,
  toHex,
  type Address,
  type Hex,
  type Log
} from "viem";
import type { EIP1193Provider } from "@privy-io/react-auth";
import { giwaSepolia } from "./giwaChain.ts";
import {
  createClientSeed,
  getBatchCommitmentId,
  giwaPackBatchAbi,
  isContractAddress
} from "./giwaPackBatch.ts";
import type { PackDetail } from "./vendingTypes.ts";

type GiwaEnvironment = ImportMeta & {
  env?: {
    VITE_GIWA_PACK_BATCH_ADDRESS?: string;
  };
};

export type GiwaWallet = {
  address: string;
  getEthereumProvider: () => Promise<EIP1193Provider>;
  switchChain: (chainId: number) => Promise<void>;
};

export type GiwaPullReceipt = {
  batchId: Hex;
  contractAddress: Address;
  drawIndex: number;
  explorerUrl: string;
  requestBlockNumber: bigint;
  requestId: bigint;
  requestTransactionHash: Hex;
};

export type GiwaPullSubmission = Pick<
  GiwaPullReceipt,
  "batchId" | "contractAddress" | "requestTransactionHash"
>;

type GiwaPullOptions = {
  onSubmitted?: (submission: GiwaPullSubmission) => void;
};

export type GiwaPackBatchState = "checking" | "live" | "sold-out" | "unavailable";

export class GiwaPullRequestRevertedError extends Error {
  constructor() {
    super("GIWA pull request reverted");
    this.name = "GiwaPullRequestRevertedError";
  }
}

const publicClient = createPublicClient({
  chain: giwaSepolia,
  pollingInterval: 500,
  transport: http(giwaSepolia.rpcUrls.default.http[0])
});

function getConfiguredEnvironmentAddress() {
  return (import.meta as GiwaEnvironment).env?.VITE_GIWA_PACK_BATCH_ADDRESS;
}

export function getGiwaPackBatchAddress(value = getConfiguredEnvironmentAddress()) {
  return isContractAddress(value) ? value : undefined;
}

export function getGiwaExplorerTransactionUrl(transactionHash: Hex | string) {
  return `${giwaSepolia.blockExplorers.default.url}/tx/${transactionHash}`;
}

export async function getGiwaPackBatchState(
  pack: Pick<PackDetail, "batchId">,
  readBatch?: (
    batchId: Hex
  ) => Promise<readonly [number, number, ...unknown[]]>
): Promise<Exclude<GiwaPackBatchState, "checking">> {
  const contractAddress = getGiwaPackBatchAddress();
  if (!readBatch && !contractAddress) return "unavailable";
  const loadBatch = readBatch ?? ((batchId: Hex) =>
    publicClient.readContract({
      address: contractAddress!,
      abi: giwaPackBatchAbi,
      functionName: "getBatch",
      args: [batchId]
    }));

  try {
    const [, available] = await loadBatch(
      getBatchCommitmentId(pack.batchId)
    );
    return available > 0 ? "live" : "sold-out";
  } catch {
    return "unavailable";
  }
}

export async function requestGiwaPull(
  wallet: GiwaWallet,
  pack: Pick<PackDetail, "batchId">,
  options: GiwaPullOptions = {}
): Promise<GiwaPullReceipt> {
  const contractAddress = getGiwaPackBatchAddress();
  if (!contractAddress) throw new Error("GIWA pack contract is not configured");
  if (!isContractAddress(wallet.address)) throw new Error("Connected wallet is not an EVM address");

  await wallet.switchChain(giwaSepolia.id);

  const batchId = getBatchCommitmentId(pack.batchId);
  const batch = await publicClient.readContract({
    address: contractAddress,
    abi: giwaPackBatchAbi,
    functionName: "getBatch",
    args: [batchId]
  });
  const [, available, , priceWei] = batch;
  if (available === 0) throw new Error("This test batch is sold out");

  const clientSeed = createClientSeed();
  const provider = await wallet.getEthereumProvider();
  const requestTransactionHash = await sendContractTransaction(provider, wallet.address, {
    to: contractAddress,
    data: encodeFunctionData({
      abi: giwaPackBatchAbi,
      functionName: "requestPull",
      args: [batchId, clientSeed]
    }),
    value: toHex(priceWei)
  });
  const submission = { batchId, contractAddress, requestTransactionHash };
  options.onSubmitted?.(submission);

  return confirmGiwaPullRequest(submission);
}

export async function confirmGiwaPullRequest(
  submission: GiwaPullSubmission
): Promise<GiwaPullReceipt> {
  const requestReceipt = await publicClient.waitForTransactionReceipt({
    hash: submission.requestTransactionHash
  });
  if (requestReceipt.status !== "success") {
    throw new GiwaPullRequestRevertedError();
  }
  const { drawIndex, requestId } = getPullRequest(
    requestReceipt.logs,
    submission.contractAddress
  );
  const requestTransactionHash = requestReceipt.transactionHash;

  return {
    batchId: submission.batchId,
    contractAddress: submission.contractAddress,
    drawIndex,
    explorerUrl: getGiwaExplorerTransactionUrl(requestTransactionHash),
    requestBlockNumber: requestReceipt.blockNumber,
    requestId,
    requestTransactionHash
  };
}

async function sendContractTransaction(
  provider: EIP1193Provider,
  from: Address,
  transaction: { data: Hex; to: Address; value?: Hex }
): Promise<Hex> {
  const result = await provider.request({
    method: "eth_sendTransaction",
    params: [{ from, ...transaction }]
  } as never);

  if (typeof result !== "string" || !result.startsWith("0x")) {
    throw new Error("Wallet did not return a transaction hash");
  }
  return result as Hex;
}

function getPullRequest(logs: readonly Log[], contractAddress: Address) {
  const event = parseEventLogs({
    abi: giwaPackBatchAbi,
    eventName: "PullRequested",
    logs: logs.filter(
      (log) => log.address.toLowerCase() === contractAddress.toLowerCase()
    ),
    strict: false
  })[0];
  if (event?.args.requestId === undefined || event.args.drawIndex === undefined) {
    throw new Error("GIWA pull request was not recorded");
  }
  return {
    drawIndex: event.args.drawIndex,
    requestId: event.args.requestId
  };
}
