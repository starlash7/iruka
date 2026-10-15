import { ReaderAccountArt } from "./features/discover/ReaderIdentity";
import { PrivyAuthActions } from "./PrivyAuthActions";

export function AuthActions({ enabled }: { enabled: boolean }) {
  if (!enabled) {
    return (
      <div className="account-content">
        <ReaderAccountArt/>
        <p role="status">로그인 설정이 필요해요.</p>
        <button disabled type="button">로그인</button>
      </div>
    );
  }
  return <PrivyAuthActions />;
}
