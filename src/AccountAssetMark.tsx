export type AccountAssetMarkKind =
  | "monad"
  | "monad-token"
  | "ethereum"
  | "giwa"
  | "upbit"
  | "usdc"
  | "usdt";

const markSources: Record<AccountAssetMarkKind, string> = {
  monad: "/assets/wallet-monad.svg",
  "monad-token": "/assets/wallet-mon.svg",
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
      <img
        alt=""
        className="account-asset-logo"
        src={markSources[kind]}
      />
    </span>
  );
}
