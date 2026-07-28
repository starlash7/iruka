import {
  createPublicClient,
  getAddress,
  http,
  isAddress,
  parseEther,
  toHex,
  zeroAddress,
  type Hex
} from "viem";
import { giwaSepolia } from "./giwaChain.ts";
import type { GiwaWallet } from "./giwaPull.ts";

type GiwaTransfer = {
  from: string;
  to: string;
  value: Hex;
};

export type GiwaTransferReceipt = {
  explorerUrl: string;
  transactionHash: Hex;
};

type GiwaTransferOptions = {
  onSubmitted?: (transactionHash: Hex) => void;
};

export class GiwaTransferRevertedError extends Error {
  constructor() {
    super("GIWA transfer reverted");
    this.name = "GiwaTransferRevertedError";
  }
}

const publicClient = createPublicClient({
  chain: giwaSepolia,
  pollingInterval: 500,
  transport: http(giwaSepolia.rpcUrls.default.http[0])
});

export function parseGiwaTransferAmount(amount: string) {
  try {
    const value = parseEther(amount.trim());
    if (value <= 0n) throw new Error();
    return value;
  } catch {
    throw new TypeError("Enter a valid amount");
  }
}

export function createGiwaTransfer(
  from: string,
  to: string,
  amount: string
): GiwaTransfer {
  if (!isAddress(from) || !isAddress(to)) {
    throw new TypeError("Enter a valid address");
  }

  const sender = getAddress(from);
  const recipient = getAddress(to);
  if (recipient === zeroAddress) {
    throw new TypeError("Enter a valid address");
  }
  if (sender === recipient) {
    throw new TypeError("Use a different address");
  }

  return {
    from: sender,
    to: recipient,
    value: toHex(parseGiwaTransferAmount(amount))
  };
}

export function getSuccessfulGiwaTransferHash(receipt: {
  status: "success" | "reverted";
  transactionHash: Hex;
}) {
  if (receipt.status !== "success") {
    throw new GiwaTransferRevertedError();
  }
  return receipt.transactionHash;
}

export async function waitForGiwaNativeTransfer(transactionHash: Hex) {
  const receipt = await publicClient.waitForTransactionReceipt({
    hash: transactionHash
  });
  const confirmedTransactionHash = getSuccessfulGiwaTransferHash(receipt);

  return {
    explorerUrl: `${giwaSepolia.blockExplorers.default.url}/tx/${confirmedTransactionHash}`,
    transactionHash: confirmedTransactionHash
  };
}

export async function sendGiwaNativeTransfer(
  wallet: GiwaWallet,
  destination: string,
  amount: string,
  options: GiwaTransferOptions = {}
): Promise<GiwaTransferReceipt> {
  const transaction = createGiwaTransfer(wallet.address, destination, amount);
  await wallet.switchChain(giwaSepolia.id);
  const provider = await wallet.getEthereumProvider();
  const result = await provider.request({
    method: "eth_sendTransaction",
    params: [transaction]
  } as never);

  if (typeof result !== "string" || !result.startsWith("0x")) {
    throw new Error("Wallet did not return a transaction hash");
  }

  const transactionHash = result as Hex;
  options.onSubmitted?.(transactionHash);
  return waitForGiwaNativeTransfer(transactionHash);
}
