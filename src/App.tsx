import { AuthActions } from "./AuthActions";

export default function App({ authEnabled = false }: { authEnabled?: boolean }) {
  const path = window.location.pathname;
  const isAccount = path === "/account" || path === "/account/";
  const isKnownPath = path === "/" || isAccount;

  return (
    <div className="app-shell">
      <header className="app-header">
        <a className="brand" href="/" aria-label="Iruka 홈">
          <img src="/brand/iruka-logomark.svg" alt="" width="36" height="36" />
          <span>Iruka</span>
        </a>
        <nav aria-label="주 메뉴">
          <a href="/" aria-current={path === "/" ? "page" : undefined}>홈</a>
          <a href="/account" aria-current={isAccount ? "page" : undefined}>계정</a>
        </nav>
      </header>
      <main className="account-surface">
        <h1>{isKnownPath ? (isAccount ? "내 계정" : "Iruka") : "페이지를 찾을 수 없어요"}</h1>
        {isKnownPath ? (
          <>
            {!isAccount && <p>한국어 AI 캐릭터·스토리 채팅</p>}
            <AuthActions enabled={authEnabled} />
          </>
        ) : <a href="/">홈으로</a>}
      </main>
    </div>
  );
}
