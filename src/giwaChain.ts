import { defineChain } from "viem";

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
      http: ["https://sepolia-rpc.giwa.io"]
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
