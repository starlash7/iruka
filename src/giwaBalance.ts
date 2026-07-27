import {
  createPublicClient,
  formatEther,
  http,
  isAddress,
  type Address
} from "viem";
import { giwaSepolia } from "./giwaChain.ts";

export type GiwaBalanceReader = {
  getBalance: (parameters: { address: Address }) => Promise<bigint>;
};

const publicClient = createPublicClient({
  chain: giwaSepolia,
  transport: http(giwaSepolia.rpcUrls.default.http[0])
});

const defaultBalanceReader: GiwaBalanceReader = {
  getBalance: ({ address }) => publicClient.getBalance({ address })
};

export function formatGiwaNativeBalance(balance: bigint) {
  if (balance === 0n) return "0 ETH";
  if (balance < 100_000_000_000_000n) return "<0.0001 ETH";

  const [whole, fraction = ""] = formatEther(balance).split(".");
  return `${whole}.${fraction.padEnd(4, "0").slice(0, 4)} ETH`;
}

export function getGiwaNativeBalance(
  address: string,
  reader: GiwaBalanceReader = defaultBalanceReader
) {
  if (!isAddress(address)) {
    return Promise.reject(new TypeError("A valid EVM address is required"));
  }

  return reader.getBalance({ address });
}
