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
| HTTP | fetch 기반 자체 클라이언트 (`shared/lib/http.ts`, axios 스타일 인터셉터) | — |
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
  - **cross-consumable 예외**: `auth`(foundation infra)와 `theme`(여러 화면이 소비하는 콘텐츠 도메인)는 예외로 허용. `.eslintrc.js`에서 소비 zone별로 `except`에 whitelist한다.
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

### 계층별 네이밍 언어 (2026-07-06 확정)

같은 도메인이라도 계층마다 이름이 답해야 할 질문이 다르다. **API/훅은 "어떻게 조회하는가", 타입/컴포넌트는 "무엇인가"** 를 말한다.

| 계층 | 언어 | 규칙 | 예시 |
|---|---|---|---|
| API 메서드 | API-친화적 | 엔드포인트·파라미터가 이름에 드러남 | `themeApi.listByCode(code)`, `getById(id)` |
| 훅 | API-친화적 | `use<도메인><조회방법>` | `useThemeListByCode(code)` |
| 타입 | 도메인 개념 | HTTP 라우트 어휘 금지, 도메인 엔티티 | `Theme`, `ThemeView` |
| 컴포넌트 | 도메인 개념 | 데이터 조회 방법이 아니라 개념을 렌더 | `ThemeWidget`, `ThemeWidgetList`, `TextOnlyWidget` |

**theme 도메인의 엔티티/컴포넌트 분리** — 엔티티 이름과 컴포넌트 이름의 언어를 나눈다:

- **엔티티 = `Theme`**: `/api/theme/list/{code}`와 향후 `/api/theme/{id}`가 **같은 도메인 엔티티**를 반환한다. 두 컨텍스트를 어휘가 아니라 **훅 이름**(`listByCode` vs 향후 `getById`)으로 구분한다. 엔티티에는 라우트 어휘를 새기지 않는다.
- **컴포넌트 = `ThemeWidget*`**: `Theme`를 홈 위젯 UI로 렌더하는 컴포넌트 레이어(`ThemeWidget` 스위치, `ThemeWidgetList`, `TextOnlyWidget`). 응답의 `type` 필드(`text_only`/`thumbnail_carousel`/`full_image_carousel`/`keyword_cloud`)는 콘텐츠 분류가 아니라 **위젯 렌더러 지시자**다.
- `ThemeList` 타입은 **만들지 않는다** — "테마들의 목록"과 "테마 안 아이템 목록"(레거시 theme-list-page)이 충돌하는 중의적 이름. 응답은 그냥 `Theme[]`.
- `ThemeView` = 서버 `themeViews[]`의 아이템 단위 (서버 필드명 유지로 도메인 추적성 확보).
- "위젯(widget)"은 React 생태계 용어가 아니라 **팀 도메인 용어**다 (컴포넌트 일반을 widget이라 부르지 않는다).

## API 레이어 패턴

- feature API는 **팩토리 + 싱글턴**으로 만든다: `createThemeApi(client: HttpClient)` → `export const themeApi = createThemeApi(http)`. `createHttpClient` 선례와 일관되고, 테스트에서 가짜 client를 생성자 주입할 수 있다. (인스턴스 상태가 없는 API 서비스에 class는 네임스페이스 역할뿐이므로 팩토리를 표준으로 한다.)
- **정규화 경계**: raw 응답 타입은 `api/` 폴더 밖으로 내보내지 않는다. `api/normalize-*.ts` 순수함수가 raw → 도메인 타입(discriminated union)으로 변환하며, 이 함수가 TDD 대상이다.
- **서버 드리븐 type 방어**: unknown type 값은 드롭(forward compat — 서버가 새 타입을 추가해도 구버전 앱이 깨지지 않는다). 렌더 불가능한 단위(빈 아이템 목록, link 없는 아이템)도 이 경계에서 드롭.
- **데이터 페칭 위치**: 스크린이 훅을 호출(컨테이너)하고, 하위 컴포넌트는 props만 받는 presentational로 유지한다. TanStack Query가 같은 queryKey를 dedup하므로 컴포넌트 레벨 페칭도 가능하지만, 한 응답이 화면 전체를 채우는 구조에서는 스크린 레벨이 표준.

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
