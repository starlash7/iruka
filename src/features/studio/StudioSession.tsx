import {usePrivy} from '@privy-io/react-auth';
import type {ReactNode} from 'react';
/** Remount private state when identity changes; never reuse another account's drafts. */
export function StudioSession({enabled,children}:{enabled:boolean;children:(identity:string)=>ReactNode}) {
 return enabled?<AuthenticatedSession>{children}</AuthenticatedSession>:children('unconfigured');
}
function AuthenticatedSession({children}:{children:(identity:string)=>ReactNode}) {
 const {ready,authenticated,user}=usePrivy();
 if(!ready)return <p role="status">로그인 확인 중…</p>;
 return children(authenticated&&user?user.id:'anonymous');
}
