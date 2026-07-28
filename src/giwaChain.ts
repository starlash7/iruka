import { defineChain } from "viem";

const GIWA_PUBLIC_RPC_URL = "https://sepolia-rpc.giwa.io";

type GiwaEnvironment = ImportMeta & {
  env?: {
    VITE_GIWA_RPC_URL?: string;
  };
};

export function getGiwaRpcUrl(value?: string) {
  if (!value) return GIWA_PUBLIC_RPC_URL;

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString().replace(/\/$/, "")
      : GIWA_PUBLIC_RPC_URL;
  } catch {
    return GIWA_PUBLIC_RPC_URL;
  }
}

export const giwaRpcUrl = getGiwaRpcUrl(
  (import.meta as GiwaEnvironment).env?.VITE_GIWA_RPC_URL
);

export const giwaSepolia = defineChain({
  id: 91342,
  name: "GIWA Sepolia",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH"
  },
  rpcUrls: {
    default: {
      http: [giwaRpcUrl]
    }
  },
  blockExplorers: {
    default: {
      name: "GIWA Sepolia Explorer",
      url: "https://sepolia-explorer.giwa.io"
    }
  },
  testnet: true
});
