export type NetworkId = "giwa" | "monad";

export function getSelectedNetwork(search: string): NetworkId | undefined {
  const network = new URLSearchParams(search).get("network");
  return network === "giwa" || network === "monad" ? network : undefined;
}

export function getNetworkUrl(href: string, network: NetworkId) {
  if (network !== "giwa" && network !== "monad") {
    throw new Error(`Unknown Iruka network: ${network}`);
  }
  const url = new URL(href);
  url.searchParams.set("network", network);
  return url.href;
}
