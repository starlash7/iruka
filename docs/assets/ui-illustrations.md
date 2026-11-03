# UI illustrations — 2026-11-01

사용자 요청: 전체 UI/UX 디테일 개선 및 필요한 에셋 직접 제작·적용.
기존 승인 작품 29종과 로고는 교체하지 않았다. 새 에셋은 정적 제품 UI 전용이며 작품 이미지 코드/DB에는 등록하지 않는다.

| 파일 | 용도 | 제작 방식 | SHA-256 |
|---|---|---|---|
| public/illustrations/story-portal-v1.jpg | 홈 첫 배너 | built-in image_gen, 원본 PNG를 JPEG 85로 인코딩. 구성·색·크기 편집 없음. 1536×1024, 약 219KB | 5c66cf9067857b5ee07fa2be6a7d42bcf28015277d1217e339f2859d9434fdc3 |
| public/illustrations/empty-stories.svg | 작품·찜·제작·크레딧 내역 빈 상태 | 직접 작성 SVG, 책/별 모티프 | 16b313b8729f628f717886afd5e2e750ddec73bfdc03c3a705c0f58abad3ea47 |
| public/illustrations/empty-conversations.svg | 대화·페르소나·로그인 안내 | 직접 작성 SVG, 말풍선 모티프 | 0aa3dbbd27317b0002ed8d91d0924878f77755356967260764a541ffcef6f956 |
| public/illustrations/empty-search.svg | 검색 결과 없음 | 직접 작성 SVG, 돋보기 모티프 | 49f17b49789bfe54a96e2fc96539df91cdfb8bc7fefbf90b513aa55b61329b28 |

새 에셋은 외부 작품·실존 인물·상표·얼굴을 참조하지 않았다. SVG는 기존 lucide 선형 아이콘과 흰색/핑크 토큰에 맞췄다. 모두 장식 이미지로 빈 alt를 사용하며 상태 설명은 DOM 텍스트로 제공한다.

## Final image prompt

Built-in `image_gen` 사용. CLI/API fallback 없음. 생성 전 `npm run build` 성공 확인.

> Use case: stylized-concept. Asset type: original atmospheric illustration for Iruka, a Korean story-chat platform, used on the RIGHT HALF of a pale pink website welcome banner. Generate a wide 3:2 landscape image. A delicate sculptural open ivory book floating above a soft rose-pink circular plinth, luminous pages curving into a thin winding ribbon, tiny pearlescent pink and lavender stars and a small translucent arched doorway suggesting a new story. Fine paper texture, beautiful premium editorial still-life, soft 3D paper craft mixed with subtle painterly shading, warm morning light, restrained and elegant. Background uniform very pale blush (#fff3f7) with gentle shadow. Objects grouped in center-right, edges clean and softly fading into blush. Strong clear silhouette readable at small mobile sizes. No people, no faces, no characters, no logos, no dolphins, no text, no letters, no watermarks. Avoid clutter, neon, dark backgrounds, childish toy appearance, metallic gold. This is a finished web UI illustration, not a screenshot or a mockup.
