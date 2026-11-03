import { usePrivy } from "@privy-io/react-auth";
import { useState } from "react";
import {LoginAccess} from "./features/auth/LoginAccess";
import {useTransferBusy} from "./features/discover/account/transferActivity";
import { RestoredWallet } from "./features/discover/account/RestoredWallet";
import { AccountView } from "./AccountView";

export function PrivyAuthActions() {
  const { authenticated, logout, ready, user } = usePrivy();
  const transferBusy=useTransferBusy();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  async function signOutUser() {
    if (busy) return;
    setBusy(true);
    setError(undefined);
    try {
      await logout();
    } catch {
      setError("로그아웃하지 못했어요. 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  if(!ready||!authenticated||!user)return <LoginAccess enabled/>;

  return (
    <AccountView
      walletPanel={authenticated ? <RestoredWallet/> : undefined}
      ready={ready}
      authenticated={authenticated}
      user={user}
      busy={busy||transferBusy}
      error={error}
      onLogin={() => {}}
      onLogout={() => void signOutUser()}
    />
  );
}
