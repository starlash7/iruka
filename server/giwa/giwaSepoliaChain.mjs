export function getGiwaSepoliaChain(rpcUrl) {
  return {
    id: 91342,
    name: "GIWA Sepolia",
    nativeCurrency: { decimals: 18, name: "Ether", symbol: "ETH" },
    rpcUrls: { default: { http: [rpcUrl] } }
  };
}
