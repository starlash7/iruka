export function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

function formatUsdcAmount(value: string) {
  const [whole, decimal = ""] = value.split(".");
  const groupedWhole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  return `${groupedWhole}.${decimal.padEnd(2, "0")}`;
}

export function formatUsdc(value: string) {
  return `${formatUsdcAmount(value)} USDC`;
}

export function formatUsdcRange(range: readonly [string, string]) {
  return `${formatUsdcAmount(range[0])} – ${formatUsdcAmount(range[1])} USDC`;
}
