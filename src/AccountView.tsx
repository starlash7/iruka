import type { User } from "@privy-io/react-auth";

import {AccountProfileHero} from "./features/discover/account/AccountProfileHero";
import {ReaderAvatar,ReaderAccountArt} from "./features/discover/ReaderIdentity";

export type AccountViewProps = {
  walletPanel?: import("react").ReactNode;
  ready: boolean;
  authenticated: boolean;
  user: Pick<User, "id" | "email" | "google" | "wallet"> | null;
  busy?: boolean;
  error?: string;
  onLogin: () => void;
  onLogout: () => void;
};

export function AccountView({
  ready, authenticated, user, busy = false, error, onLogin, onLogout, walletPanel
}: AccountViewProps) {
  if (!ready || (authenticated && !user)) {
    return <button disabled type="button">계정 확인 중…</button>;
  }

  return (
    <div className="account-content">
      {walletPanel?<AccountProfileHero accountLabel="내 계정" overviewLabel="개요" inventoryLabel="보관함"/>:<ReaderAccountArt/>}
      {authenticated && user ? (
        <>
          <ReaderAvatar identity={user.id}/>
          <dl>
            <dt>이름</dt>
            <dd>{user.google?.name?.trim() || "Iruka 사용자"}</dd>
            {(user.email?.address || user.google?.email) && (
              <>
                <dt>이메일</dt>
                <dd>{user.email?.address || user.google?.email}</dd>
              </>
            )}
            {user.wallet?.address && !walletPanel && <>
              <dt>연결된 지갑</dt>
              <dd style={{overflowWrap: "anywhere"}}>{user.wallet.address}</dd>
            </>}
          </dl>
          {walletPanel}
          <button className="iruka-secondary-button" disabled={busy} onClick={onLogout} type="button">
            {busy ? "로그아웃 중…" : "로그아웃"}
          </button>
        </>
      ) : (
        <>
          <p>지갑 · Google · 이메일로 로그인</p>
          <button className="iruka-action-button" onClick={onLogin} type="button">로그인</button>
        </>
      )}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
