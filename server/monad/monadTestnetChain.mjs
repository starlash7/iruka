export const MONAD_TESTNET_RPC_URL = "https://testnet-rpc.monad.xyz";
export const MONAD_EXPLORER_URL = "https://testnet.monadvision.com";

export function getMonadTestnetChain(rpcUrl = MONAD_TESTNET_RPC_URL) {
  return {
    id: 10143,
    name: "Monad Testnet",
    nativeCurrency: { decimals: 18, name: "MON", symbol: "MON" },
    rpcUrls: { default: { http: [rpcUrl] } }
  };
}

export async function assertMonadTestnet(publicClient) {
  if (await publicClient.getChainId() !== 10143) {
    throw new Error("RPC must connect to Monad Testnet (10143)");
  }
}
