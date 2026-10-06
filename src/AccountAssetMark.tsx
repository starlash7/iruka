export type AccountAssetMarkKind =
  | "monad"
  | "ethereum"
  | "giwa"
  | "upbit"
  | "usdc"
  | "usdt";

const markSources: Record<Exclude<AccountAssetMarkKind, "monad">, string> = {
  ethereum: "/assets/wallet-ethereum.png",
  giwa: "/assets/wallet-giwa.png",
  upbit: "/assets/wallet-upbit.png",
  usdc: "/assets/wallet-usdc.png",
  usdt: "/assets/wallet-usdt.png"
};

export function AccountAssetMark({
  kind
}: {
  kind: AccountAssetMarkKind;
}) {
  return (
    <span
      aria-hidden="true"
      className={`account-asset-mark account-asset-mark-${kind}`}
    >
      {kind === "monad" ? "MON" : <img
        alt=""
        className="account-asset-logo"
        src={markSources[kind]}
      />}
    </span>
  );
}
