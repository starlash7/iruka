# Iruka

한국어 AI 캐릭터·스토리 채팅 플랫폼으로 전환 중입니다.
현재 구현은 React/Vite + Privy Google·이메일 로그인, 서버 인증·로컬 DB·공유 API/SSE와 공통 UI 기반입니다.
작품 탐색·제작·대화, 무료 테스트 크레딧, GIWA 장부 앵커링은 다음 단계입니다.

```sh
nvm use
npm ci
cp .env.example .env.local
npm run db:migrate
npm run dev
```

`.env.local`의 `VITE_PRIVY_APP_ID`와 필요 시 client ID를 설정하고 Privy
대시보드에서 Google/Email과 로컬 origin을 활성화하세요. 미설정 상태에서도
앱은 실행되며 로그인 버튼은 비활성화됩니다. 이메일 인증은 Privy OTP 흐름입니다.
외부 지갑 연결/자동 생성/SIWE는 요구하지 않습니다.

탐색·작품·채팅·스튜디오·페르소나·크레딧의 빈 라우트와 `/account`가 있습니다. 기존 브랜드 자료: `/#brand-kit`.
로컬 API는 Vite `/api` 프록시로 연결됩니다. 서버 인증에는 `PRIVY_APP_ID`와 `PRIVY_VERIFICATION_KEY`도 필요합니다.
검증: `npm test`, `npm run build`. 실제 OAuth/이메일 완료는 별도 수동 확인이 필요합니다.

- [최신 범위](docs/pivot/CURRENT_SCOPE.md)
- [공통 기반 실행·병렬 인계](docs/pivot/FOUNDATION_HANDOFF.md)
- [01 정리 기록](docs/pivot/HANDOFF.md)
- [Feature map](docs/FEATURE_MAP.md)
- [과거 제품 자료](docs/archive/tcg/README.md)

이 브랜치의 Vercel Git 자동 배포는 비활성화했습니다. main push/merge, 배포,
유료 API 호출은 이번 작업 범위에 포함되지 않습니다. 비밀값을 커밋하지 마세요.
