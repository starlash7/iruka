import {
  createPublicClient,
  getAddress,
  http,
  isAddress,
  parseEther,
  toHex,
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
  if (sender === recipient) {
    throw new TypeError("Use a different address");
  }

  return {
    from: sender,
    to: recipient,
    value: toHex(parseGiwaTransferAmount(amount))
  };
}

export async function sendGiwaNativeTransfer(
  wallet: GiwaWallet,
  destination: string,
  amount: string
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
  await publicClient.waitForTransactionReceipt({ hash: transactionHash });

  return {
    explorerUrl: `${giwaSepolia.blockExplorers.default.url}/tx/${transactionHash}`,
    transactionHash
  };
}
