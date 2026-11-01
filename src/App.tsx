import { matchRoute, routePages } from './routes';
import { Page } from './ui';
import {useReader} from './features/discover/ReaderProvider';
import {ReaderLayout} from './features/discover/ReaderLayout';

export default function App({ authEnabled = false }: { authEnabled?: boolean }) {
  const {href}=useReader();
  const route = matchRoute(window.location.pathname);
  const RoutePage = route ? routePages[route.id] : null;
  if(route&&RoutePage&&['home','ranking','search','tag','work','chat','chats'].includes(route.id))return <>
    <a className="skip-link" href="#main">본문으로 건너뛰기</a>
    <main id="main" tabIndex={-1}><RoutePage params={route.params} authEnabled={authEnabled}/></main>
  </>;
  const active = route?.id==='favorites'?'favorites':route && ['studio', 'editor'].includes(route.id) ? 'studio' : 'account';
  return <>
    <a className="skip-link" href="#main">본문으로 건너뛰기</a>
    <main id="main" tabIndex={-1}>
      <ReaderLayout active={route ? active : 'none'}><div className="reader-content reader-feature-content">
      {route && RoutePage ? <RoutePage params={route.params} authEnabled={authEnabled} />
        : <Page title="페이지를 찾을 수 없어요"><a href={href("/")}>홈으로</a></Page>}
      </div></ReaderLayout>
    </main>
  </>;
}
