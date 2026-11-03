import type {ReactNode} from 'react';
import {Page} from '../../ui';
import {ReaderSession} from '../discover/ReaderSession';
import {SignInNotice} from '../discover/SignInNotice';
/** Remount private state when identity changes; never reuse another account's drafts. */
export function StudioSession({enabled,children}:{enabled:boolean;children:(identity:string)=>ReactNode}) {
 return <ReaderSession enabled={enabled}>{session=>session.identity?children(session.identity):<Page title="작품 만들기">{!enabled?<p role="status">로그인 설정이 필요해요.</p>:<SignInNotice {...session} message="로그인 후 내 작품을 만들고 관리할 수 있어요."/>}</Page>}</ReaderSession>;
}
