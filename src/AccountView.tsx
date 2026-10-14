import type { User } from "@privy-io/react-auth";

export type AccountViewProps = {
  ready: boolean;
  authenticated: boolean;
  user: Pick<User, "id" | "email" | "google"> | null;
  busy?: boolean;
  error?: string;
  onLogin: () => void;
  onLogout: () => void;
};

export function AccountView({
  ready, authenticated, user, busy = false, error, onLogin, onLogout
}: AccountViewProps) {
  if (!ready || (authenticated && !user)) {
    return <button disabled type="button">계정 확인 중…</button>;
  }

  return (
    <div className="account-content">
      {authenticated && user ? (
        <>
          <dl>
            <dt>이름</dt>
            <dd>{user.google?.name?.trim() || "Iruka 사용자"}</dd>
            {(user.email?.address || user.google?.email) && (
              <>
                <dt>이메일</dt>
                <dd>{user.email?.address || user.google?.email}</dd>
              </>
            )}
          </dl>
          <button disabled={busy} onClick={onLogout} type="button">
            {busy ? "로그아웃 중…" : "로그아웃"}
          </button>
        </>
      ) : (
        <>
          <p>Google 또는 이메일로 로그인</p>
          <button onClick={onLogin} type="button">로그인</button>
        </>
      )}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
