import { getSelectedNetwork, type NetworkId } from "./networkSelection.ts";
import { defineChain, isAddress, zeroAddress } from "viem";
import { getGiwaRpcUrl, giwaSepolia } from "./giwaChain.ts";

export type DeploymentEnvironment = {
  VITE_IRUKA_DEPLOYMENT?: string;
  VITE_GIWA_RPC_URL?: string;
  VITE_GIWA_PACK_BATCH_ADDRESS?: string;
  VITE_MONAD_RPC_URL?: string;
  VITE_MONAD_PACK_BATCH_ADDRESS?: string;
};

function getMonadRpcUrl(value?: string) {
  const fallback = "https://testnet-rpc.monad.xyz";
  if (!value) return fallback;
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol)
      ? url.toString().replace(/\/$/, "") : fallback;
  } catch {
    return fallback;
  }
}

export function getDeployment(env: DeploymentEnvironment = {}, selectedNetwork?: NetworkId) {
  const id = selectedNetwork ?? env.VITE_IRUKA_DEPLOYMENT ?? "giwa";
  if (id !== "giwa" && id !== "monad") {
    throw new Error(`Unknown Iruka deployment: ${id}`);
  }
  const rpcUrl = id === "monad"
    ? getMonadRpcUrl(env.VITE_MONAD_RPC_URL)
    : getGiwaRpcUrl(env.VITE_GIWA_RPC_URL);
  const chain = id === "monad" ? defineChain({
    id: 10143,
    name: "Monad Testnet",
    nativeCurrency: { decimals: 18, name: "Monad", symbol: "MON" },
    rpcUrls: { default: { http: [rpcUrl] } },
    blockExplorers: { default: { name: "MonadVision", url: "https://testnet.monadvision.com" } },
    testnet: true
  }) : defineChain({ ...giwaSepolia, rpcUrls: { default: { http: [rpcUrl] } } });
  const address = id === "monad"
    ? env.VITE_MONAD_PACK_BATCH_ADDRESS : env.VITE_GIWA_PACK_BATCH_ADDRESS;

  return {
    id,
    chain,
    rpcUrl,
    contractAddress: address && isAddress(address) && address.toLowerCase() !== zeroAddress
      ? address : undefined,
    packId: "debut",
    batchLabel: id === "monad" ? "IRK-MON-2026-001" : "IRK-GG-2026-001",
    fulfillmentPath: id === "monad" ? "/api/monad/fulfill" : "/api/giwa/fulfill",
    faucetUrl: id === "monad" ? "https://faucet.monad.xyz" : "https://faucet.giwa.io",
    allowFixturePull: id === "giwa"
  } as const;
}

const deploymentEnvironment = import.meta.env ?? {};
export const supportedDeployments = [
  getDeployment(deploymentEnvironment, "giwa"),
  getDeployment(deploymentEnvironment, "monad")
];
export const activeDeployment = getDeployment(
  deploymentEnvironment,
  typeof window === "undefined" ? undefined : getSelectedNetwork(window.location.search)
);
export const activeChain = activeDeployment.chain;

export function getDeploymentStorageKey(
  surface: "pull" | "transfer" | "collection",
  walletAddress: string
) {
  const namespace = surface === "collection"
    ? activeDeployment.id === "giwa" ? "collection" : "collection:monad"
    : `${activeDeployment.id}-${surface}`;
  return `iruka:${namespace}:${activeChain.id}:${walletAddress.toLowerCase()}`;
}
