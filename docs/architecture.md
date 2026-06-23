# 포스텔러 RN — Architecture & Conventions

기존 Ionic/Angular/Capacitor 앱(`forceteller-app`)을 React Native로 옮기기 위한 **개발 토대(foundation)** 의 구조와 규칙을 기록한다. 이 문서는 스캐폴드 시점에 합의된 결정의 단일 출처(SSOT)다.

## Stack

| 영역 | 선택 | 버전(스캐폴드 시점) |
|---|---|---|
| 런타임 | React Native (bare, Community CLI) | RN 0.86.0 / React 19.2.3 |
| 언어 | TypeScript | 5.8.x |
| 패키지 매니저 | pnpm (`node-linker=hoisted`) | 10.18.3 (corepack 고정) |
| 네비게이션 | React Navigation (native-stack + bottom-tabs) | 7.x |
| 서버 상태 | TanStack Query | 5.x |
| 클라이언트 상태 | Zustand | 5.x |
| 환경변수 | react-native-config | 1.6.x |
| HTTP | axios | 1.x |
| Path alias | babel-plugin-module-resolver + tsconfig paths (`@/*`) | — |

> **pnpm + RN**: RN 툴체인(Metro/autolinking/CocoaPods)은 pnpm 기본 symlink node_modules와 충돌한다. `.npmrc`의 `node-linker=hoisted`로 npm/Yarn Classic 같은 flat 구조를 만들어 해소한다. (출처: [pnpm.io/settings#nodelinker](https://pnpm.io/settings) — "useful if your tooling doesn't work with symlinks (like React Native)")

## 아키텍처: 도메인 베이스 (3-레이어)

bulletproof-react식 feature 격리에 FSD의 `shared` 레이어 개념을 결합. `src/` 최상위는 **`app` · `features` · `shared`** 셋뿐이다.

```
src/
├─ app/                 # 엔트리·providers·navigation 루트 (가장 위 레이어)
│  ├─ App.tsx
│  ├─ providers/        # app-providers (SafeAreaProvider + QueryClientProvider)
│  └─ navigation/       # root-navigator, navigation-types
├─ features/            # 도메인 모듈 (서로 import 금지) — 탭: 홈/투데이/프리미엄/더보기
│  ├─ home/             # 홈
│  ├─ today/            # 투데이 (오늘의 운세 — api·hooks·stores·screens·types 전체 예시)
│  ├─ premium/          # 프리미엄
│  └─ more/             # 더 보기 (메뉴 허브 — 추후 프로필·설정·북마크 등 진입)
│      └─ { api/ screens/ components/ hooks/ stores/ types/ } + index.ts(barrel)
└─ shared/              # 도메인 무관 공용 (가장 아래 레이어, 어디서나 import 가능)
   ├─ components/       # 공용 UI (디자인시스템 진입점)
   ├─ lib/              # api-client(axios), query-client
   ├─ config/           # env (react-native-config)
   ├─ theme/            # light/dark 팔레트, useAppColors(), RN Navigation 테마 (포팅 시 storybook 토큰 연동)
   ├─ types/  utils/    # 공용 타입 / 테마별 util (제네릭 utils.ts 금지)
   └─ hooks/ stores/    # 공용 훅 / 전역 store — 첫 사용 시점에 생성
```

### 의존성 규칙 (단방향: shared → features → app)

ESLint `import/no-restricted-paths`로 **강제**한다 (`.eslintrc.js`):

- `shared`는 `features`/`app`을 import할 수 없다 (최하위 레이어).
- `features`는 `app`을 import할 수 없다.
- **feature 간 직접 import 금지** — 각 feature는 격리. 공유가 필요하면 `shared`로 승격.
- `app`은 `features`·`shared`를 자유롭게 import (조립 레이어).

위반 시 lint 에러. feature 추가 시 `.eslintrc.js`의 zones에 해당 feature 줄을 추가한다.

## 네이밍 컨벤션

기존 forceteller 팀 관행(Angular 영향: kebab-case + hyphen 접미사)과 현재 Angular 2025 공식 스타일 가이드를 대조해 확정.

| 종류 | 규칙 | 예시 |
|---|---|---|
| 폴더 | kebab-case | `features/astro-compatibility/` |
| 컴포넌트 파일 | kebab-case `.tsx`, **export 심볼은 PascalCase** | `text-field.tsx` → `export function TextField` |
| 화면 | `*-screen.tsx` (kebab) | `horoscope-screen.tsx` |
| 훅 | camelCase `useX.ts` (React 관용 예외) | `useHoroscope.ts` |
| 스토어 | `*-store.ts` | `horoscope-store.ts` |
| API | `*-api.ts` | `horoscope-api.ts` |
| 타입 | `*-types.ts` | `horoscope-types.ts` |
| 유틸 | 테마별 파일, **제네릭 `utils.ts` 금지** | `format-date.ts` |
| 배럴 | feature/세그먼트마다 `index.ts` | `features/horoscope/index.ts` |

근거: 현 Angular 가이드는 `.component.ts` 같은 dot 접미사를 폐기(2025 스타일 = 간결 kebab), feature 단위 구성, 제네릭 `utils.ts` 지양을 권장. 팀은 가독성을 위해 hyphen 타입 접미사(`-store`/`-api`/`-screen`)를 의식적으로 유지한다. (출처: [angular.dev/style-guide](https://angular.dev/style-guide), [angular.dev/cli/generate/application](https://angular.dev/cli/generate/application))

## Import 규칙

- **레이어 간**(features→shared, app→features/shared): `@/` alias 사용 — `import { apiClient } from '@/shared/lib'`.
- **같은 feature/레이어 내부**: 상대 경로 — `import { fetchTodayHoroscope } from '../api/horoscope-api'`.
- feature 외부에서는 항상 feature의 **barrel(`index.ts`)** 을 통해 import (내부 구조 은닉).

## 이번 스캐폴드 범위 밖 (포팅 단계에서 진행)

- 네이티브 SDK 매핑 (OneSignal/AppsFlyer/MoEngage/Branch/SQLite 등 Capacitor 플러그인 → RN 대응)
- 디자인 토큰 연동 (forceteller-storybook → `shared/theme`)
- 실제 API 연동 (thales-api), 인증/세션
- 멀티리전(KR/EN/JP) flavor 구성 — 현재 단일 `com.un7qi3i.forceteller`
- `pod install` 및 실기기/시뮬레이터 빌드

## 환경 노트

- **watchman**: 현재 머신의 watchman이 `icu4c` dylib 로드 실패 상태. Metro 실행 전 `brew reinstall watchman` (또는 `brew reinstall icu4c`) 필요. 스캐폴드/타입체크/테스트에는 불필요.
- **pnpm**: corepack으로 고정 (`corepack enable pnpm`). `packageManager` 필드가 10.18.3을 핀.
- **iOS**: 시스템 ruby 3.0.2 + CocoaPods 1.16.2. `pod install` 시 `export LANG=en_US.UTF-8` 필요할 수 있음. `bundle install && bundle exec pod install` (ios/).
