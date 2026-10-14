import type { ComponentType } from 'react';
import { routes, type RoutePageProps } from './paths';
import HomePage from '../features/discovery/HomePage';
import RankingPage from '../features/discovery/RankingPage';
import SearchPage from '../features/discovery/SearchPage';
import TagPage from '../features/discovery/TagPage';
import WorkPage from '../features/discovery/WorkPage';
import ChatPage from '../features/chat/ChatPage';
import StudioPage from '../features/studio/StudioPage';
import EditorPage from '../features/studio/EditorPage';
import PersonasPage from '../features/user/PersonasPage';
import CreditsPage from '../features/credits/CreditsPage';
import AccountPage from '../features/user/AccountPage';

export { matchRoute, routes, type RoutePageProps } from './paths';
export const routePages: Record<typeof routes[number]['id'], ComponentType<RoutePageProps>> = {
  home: HomePage,
  ranking: RankingPage,
  search: SearchPage,
  tag: TagPage,
  work: WorkPage,
  chat: ChatPage,
  studio: StudioPage,
  editor: EditorPage,
  personas: PersonasPage,
  credits: CreditsPage,
  account: AccountPage,
};
