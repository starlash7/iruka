// Browser-only test entry. Not imported by the product or route table.
import React from 'react';
import {createRoot} from 'react-dom/client';
import {PersonaManager} from '../../src/features/user/personas/PersonaManager';
import {createPersonaClient} from '../../src/features/user/personas/client';
import {Page} from '../../src/ui';
import '../../src/styles.css';
createRoot(document.getElementById('root')!).render(<main className="app-shell"><Page title="내 페르소나" description="이야기 속 나의 모습을 관리하는 곳이에요."><PersonaManager client={createPersonaClient({getAccessToken:async()=>null})}/></Page></main>);
