# 디자인 토큰 기반 색상 시스템 설계

**작성일:** 2026-07-02
**브랜치:** `feature/design-tokens-color-system` (main 98f9717에서 분기, 2026-07-02 구현 완료)
**관련:** shared/theme placeholder 팔레트의 정식 대체. 타이포/치수/섀도/컴포넌트 레이어는 후속 spec.

---

## Goal

디자인 시스템에서 export한 **토큰 JSON을 단일 원본(source of truth)** 으로 삼아, RN 앱의 색상 시스템을 재편한다. `theme.day`/`theme.night` 시맨틱 컬러를 codegen으로 TS 코드에 반영하고, **system/day/night 3모드 테마 전환**(MMKV 영속)을 도입한다. 기존 placeholder 팔레트(`AppColors`)와 소비처 6곳을 시맨틱 구조로 마이그레이션한다.

## Architecture (요약)

`assets/design-tokens/tokens.json`(디자이너 export 원본 커밋) → `scripts/generate-theme.js`(의존성 0 codegen) → `src/shared/theme/generated/`에 `palette.ts`(원색 상수) + `mode-colors.ts`(day/night `ModeColors`가 palette 상수를 참조) → `ThemeProvider`(mode 상태 + MMKV 영속 + OS 스킴 구독) → `useAppColors()`/`useTheme()` 훅으로 소비. 토큰 업데이트 = JSON 교체 + `npm run generate:theme` 재실행으로 끝나며 소비처는 무수정.

## Tech Stack

- Node 내장 모듈만으로 codegen (`scripts/generate-theme.js`) — 외부 의존성 0
- `react-native-mmkv` 4.x — 테마 모드 영속 (기존 `KVStore` DI 패턴 재사용)
- React Context — ThemeProvider (기존 `AppProviders` 합성에 추가)
- jest — codegen 순수 함수 + `resolveTheme` + storage 단위 테스트

---

## 배경 / 현황

- [src/shared/theme/colors.ts](../../../src/shared/theme/colors.ts) 주석에 명시된 대로 현재 팔레트는 **placeholder**. 다크 팔레트는 정식 토큰 없이 유추한 값이었으나, 이번 토큰 JSON에 **night 세트가 정식으로 존재**하므로 해소된다.
- 토큰 원본: 디자인 시스템(Figma Component Library)에서 export한 JSON (W3C 스타일 `type`/`value` + `{palette.x.y}` 참조 문법). 사용자 보유분을 repo에 커밋한다.
- `AppColors` 소비처 인벤토리 (2026-07-02 grep 기준):
  - `src/app/navigation/tab-bar.tsx`
  - `src/shared/components/screen-container.tsx`
  - `src/shared/components/placeholder-screen.tsx`
  - `src/features/home/screens/home-screen.tsx`
  - `src/features/auth/screens/login-screen.tsx`
  - `src/features/web/screens/web-screen.tsx`
  - (테마 내부) `navigation-theme.ts`, `useAppColors.ts`, `index.ts` + `App.tsx`의 StatusBar(`useColorScheme` 직접 사용)
- **탭바 값 일치 확인**: 현행 하드코딩 `#191919`/`#ADADAD`/`#E8E8E8`/`#FFFFFF`가 토큰 `gray.900(text.default)`/`gray.300(text.muted)`/`gray.100(stroke.subtle)`/`white(background.surface)`와 정확히 일치 — 탭바는 시각 변화 0으로 마이그레이션 가능.
- **폰트 갭**: 타이포 토큰은 전부 Noto Sans KR 지정이나 앱에 번들 폰트 0, `fontFamily` 사용처 0 — 타이포 단계(후속)에서 폰트 에셋 작업 선행 필요.

### 토큰 JSON 구조 요약

| 계층 | 내용 |
|---|---|
| `primitive.palette` | 8색군 × 10단계(50~900) + white — gray, kkarina-blue, red, teal-blue, pink, yellow, bronze, silver |
| `primitive.radius/spacing/typography/shadow` | 이번 범위 밖 (radius 4, spacing 15, 타이포 17종, 섀도 3레벨) |
| `primitive.primary/secondary/accent/background/text/stroke` | 시맨틱 그룹 — **`theme.day`와 완전 중복이라 무시** |
| `theme.day` / `theme.night` | 시맨틱 컬러 정본. night는 시맨틱별 재매핑(primary: gray.900→white, 오행 accent: 700→500 등) |

- `accent`는 오행(wood/fire/earth/metal/water) × 본색/tonal × on-* 구조 — 도메인 특화 시맨틱.
- theme은 **색상만** 오버라이드 — 타이포/치수/섀도는 모드 무관.

---

## 결정 사항

| 항목 | 결정 | 근거 |
|---|---|---|
| **범위** | 색상 시스템만 (day/night 시맨틱 + 테마 전환 + 소비처 마이그레이션) | 사용자 선택. 치수/타이포/섀도/컴포넌트 레이어는 후속 |
| **파이프라인** | 자체 codegen 스크립트 (의존성 0) | 단계적 확장 방침상 "재생성 가능"이 필수 요건. Style Dictionary는 이번 범위엔 과함(수동 1회 변환은 drift 재발 위험) |
| **테마 전환** | system/day/night 3모드 + MMKV 영속 | 사용자 선택. 토글 UI는 후속, `setMode` API까지가 이번 코어 |
| **테마 용어** | `day`/`night` 유지 (light/dark로 변환 안 함) | 디자인 시스템·디자이너와 용어 일치. OS light/dark 매핑은 `resolveTheme` 런타임 책임 |
| **정본 스코프** | `theme.day`/`theme.night`만 사용, `primitive`의 시맨틱 그룹 무시 | 완전 중복 확인됨 |
| **토큰 위치** | `assets/design-tokens/tokens.json` | 사용자 선택. 루트 `assets/`는 bootsplash 원본 등 "생성 입력물" 성격 — 동일 맥락 |
| **2층 생성물 구조** | `palette.ts`(원색 상수) + `mode-colors.ts`(모드 컬러가 palette 참조) | 사용자 선택. 토큰의 참조 구조를 코드에 보존 — 생성물 가독성과 토큰 변경 diff 명확성. 단 **공개 API는 모드 컬러만 노출**(팔레트는 theme 내부용 — 컴포넌트의 팔레트 직접 소비를 막아 시맨틱 레이어 무력화 방지) |
| **탭바 컴포넌트 토큰** | 만들지 않음 — 시맨틱 직접 소비 | 토큰에 tab bar 시맨틱 부재 + hex 일치 확인. 컴포넌트 토큰 레이어는 후속 판단 |
| **`useAppColors` 이름 유지** | 반환 타입만 `ModeColors`로 교체 | 훅 이름·`makeStyles(colors)` 패턴 유지로 마이그레이션 diff 최소화 |
| **호환 브릿지 없음** | 구 `AppColors` 어댑터 안 만들고 일괄 전환 | 소비처 6곳뿐 — 브릿지 유지비가 더 큼 |
| **웹뷰 동기화** | 범위 밖 — `resolvedTheme` 노출까지만 | 전달 메커니즘(URL 파라미터/postMessage)은 웹 파트 협의 필요 |

---

## 상세 설계

### 파일 구조

```
assets/design-tokens/
  tokens.json              # 원본 (디자이너 export 그대로, 손수정 금지)
scripts/
  generate-theme.js       # codegen 엔트리 (Node 내장 모듈만, CJS — jest 호환)
src/shared/theme/
  generated/
    palette.ts             # 생성물: 팔레트 원색 상수 (8색군×10단계 + white)
    mode-colors.ts              # 생성물: ModeColors 타입 + dayColors/nightColors (palette 참조)
  theme-provider.tsx       # ThemeProvider + Context
  theme-storage.ts         # KVStore DI 패턴 모드 영속
  resolve-theme.ts         # (mode, osScheme) → 'day'|'night' 순수 함수
  use-theme.ts             # useTheme() / useAppColors()
  navigation-theme.ts      # 생성물 소비하도록 수정
  spacing.ts               # 현행 유지 (범위 밖)
  index.ts                 # 공개 API
```

### 생성물 계약

```ts
// generated/palette.ts (발췌) — 토큰 primitive.palette의 미러. 파일 헤더에 "generated — do not edit"
export const palette = {
  gray: { 50: '#f4f4f4', /* ... */ 900: '#191919' },
  kkarinaBlue: { /* 50~900 */ },
  // red, tealBlue, pink, yellow, bronze, silver 동일 구조
  white: '#ffffff',
} as const;

// generated/mode-colors.ts (발췌) — 모드 컬러가 palette 상수를 참조 (토큰의 참조 구조를 코드에 보존)
export type ModeColors = {
  primary: { primary: string; onPrimary: string; primaryDisabled: string; onPrimaryDisabled: string };
  secondary: { secondary: string; onSecondary: string; secondaryDisabled: string; onSecondaryDisabled: string };
  accent: {
    wood: string; onWood: string; woodTonal: string; onWoodTonal: string;
    fire: string; onFire: string; fireTonal: string; onFireTonal: string;
    earth: string; onEarth: string; earthTonal: string; onEarthTonal: string;
    metal: string; onMetal: string; metalTonal: string; onMetalTonal: string;
    water: string; onWater: string; waterTonal: string; onWaterTonal: string;
  };
  background: { default: string; surface: string; inset: string; highlight: string; alert: string };
  text: { default: string; subtle: string; muted: string; link: string; alert: string; force: string; forceInversed: string };
  stroke: { default: string; subtle: string; muted: string; primary: string; alert: string };
};
export const dayColors: ModeColors = {
  text: { default: palette.gray[900], subtle: palette.gray[600], /* ... */ force: '#c38800' /* off-palette */ },
  /* ... */
};
export const nightColors: ModeColors = { /* ... */ };
```

- 네이밍 변환: kebab-case → camelCase (`kkarina-blue`→`kkarinaBlue`). 팔레트 단계 키는 숫자 인덱스(`palette.gray[900]`)로 토큰 표기와 일치. `accent` 그룹은 `accent-wood`→`wood`, `on-accent-wood`→`onWood`, `accent-wood-tonal`→`woodTonal`, `on-accent-wood-tonal`→`onWoodTonal`로 접두 중복 제거.

### Codegen 규칙

1. 정본은 `theme.day`/`theme.night`. `primitive`에서는 `palette`만 참조 해석에 사용.
2. 참조 해석: `{palette.*}`는 `primitive.palette`에서, `{primary.primary}` 같은 시맨틱 상호참조는 **해당 테마 스코프 우선** 재귀 해석. 순환 참조는 에러.
3. emit 규칙: `{palette.*}` 참조는 hex로 풀지 않고 `palette.gray[900]` **상수 참조로 출력**. 시맨틱 상호참조는 최종 팔레트 참조까지 해석해 출력. 팔레트에 없는 리터럴 hex(`text.force` 등)는 hex 그대로 출력 — off-palette임이 생성물에서 드러나게.
4. 검증 실패 시 생성 중단(비-0 exit): day/night 키 비대칭, 깨진 참조, hex 형식 오류.
5. `package.json`에 `"generate:theme": "node scripts/generate-theme.js"` 추가. 출력은 repo prettier 설정 준수.
6. 스크립트 내부는 파싱/해석/직렬화를 순수 함수로 분리해 jest로 테스트 가능하게.

### 런타임 아키텍처

```
ThemeMode = 'system' | 'day' | 'night'
resolveTheme(mode, osScheme): system이면 (dark→night, 그 외→day), 아니면 mode 그대로
```

- `ThemeProvider`: MMKV에서 mode 동기 복원(기본 `system`), `useColorScheme()` 구독, `setMode` 시 저장+반영. Context value = `{ colors, mode, resolvedTheme, setMode }`.
- 배치: `AppProviders` 합성에 추가 — SplashGate·RootNavigator보다 상위.
- `useAppColors()`: `colors`(ModeColors)만 반환. Provider 밖 호출은 명시적 throw.
- `useTheme()`: 전체 value 반환 — StatusBar, (후속) 설정 UI용.
- StatusBar: `App.tsx`의 `useColorScheme` 직접 사용을 `resolvedTheme` 기반으로 교체 — 수동 night 모드에서도 상태바 스타일이 따라오도록. StatusBar 렌더 위치를 Provider 안쪽 컴포넌트로 이동.

### 마이그레이션 방침

⚠️ **의미 교차 주의**: 기존 `background: #FFFFFF` / `surface: #F4F2FA` ↔ 토큰 `background.default: #f4f4f4` / `background.surface: #ffffff` — **이름 기준 기계 매핑 금지.** "역할 기준"으로 매핑한다: 화면 기본 배경이던 곳(#FFF) → `background.surface` 우선 검토, 파일별 확정 표는 구현 플랜에서 작성.

| 대상 | 변경 | 시각 변화 |
|---|---|---|
| `tab-bar.tsx` | `tabBarActive`→`text.default`, `tabBarInactive`→`text.muted`, `tabBarBorder`→`stroke.subtle`, `tabBarBackground`→`background.surface` | 없음 (hex 동일) |
| `screen-container.tsx` | `background`→역할 기준 재매핑 | 파일별 확정 |
| home/login/web/placeholder 화면 | 사용 키 역할 기준 재매핑 | 보라 계열 placeholder(`primary #7C5CFF`, `surface #F4F2FA` 등) 사용처는 **정식 토큰 값으로 교정됨** (의도된 변화) |
| `navigation-theme.ts` | day/night 기반 재매핑. 후보: `primary`→`primary.primary`, `card`→`background.surface`, `text`→`text.default`, `border`→`stroke.default`. `background`(scene 배경)은 default vs surface를 역할 기준으로 구현 플랜에서 확정 | 있음 (placeholder 교정) |
| `App.tsx` | StatusBar `resolvedTheme` 기반화 | 수동 모드에서만 체감 |
| 구 `colors.ts`/`useAppColors.ts` | 마이그레이션 완료 후 삭제 | — |

### 테스트 전략

- codegen: 참조 해석·순환 감지·비대칭 검증·알려진 입력→출력 단위 테스트 (`__tests__` 기존 패턴)
- `resolveTheme`: 순수 함수 전 케이스 (3모드 × 2스킴)
- `theme-storage`: fake KVStore 주입 (splash-storage 테스트 선례)
- 컴포넌트 테스트는 도입하지 않음 (repo에 인프라 부재 — 현행 방침 유지)

### 커밋 분리 (단일 브랜치)

1. `tokens.json` + codegen 스크립트 + 생성물 + 스크립트 테스트
2. `resolve-theme`/`theme-storage`/`ThemeProvider`/훅 + 테스트
3. 소비처 마이그레이션 (탭바 → 컨테이너/화면 → navigation-theme/StatusBar)
4. 구 팔레트 제거 + index 공개 API 정리

---

## 확인 필요 / 미해결 (범위 밖 기록)

| 항목 | 상태 |
|---|---|
| `typography.numeric: 0`의 용도 | 디자이너 확인 필요 (storybook `NumericText` 연관 추정) — 타이포 단계에서 |
| `radius`에 `sm` 부재 (xs→md) | export 누락인지 의도인지 확인 필요 — 치수 단계에서 |
| 섀도의 RN 구현 방식 | iOS shadow vs Android elevation vs RN 신규 `boxShadow` — 공식 문서 확인 후 섀도 단계에서 결정 |
| 테마 토글 UI | More 탭 설정 항목으로 후속 |
| 웹뷰 테마 동기화 | 웹 파트와 전달 메커니즘 협의 후 후속 |
| 웹(storybook) 크로스 플랫폼 출력 | 요구 발생 시 codegen → Style Dictionary 전환 검토 |

## 후속 로드맵

1. **치수**: spacing(15단계)/radius → 기존 `spacing.ts` 대체
2. **타이포**: Noto Sans KR 번들링(iOS/Android 링크) + 17종 텍스트 스타일 + `AppText` 컴포넌트
3. **섀도**: 3레벨 크로스 플랫폼 구현
4. **컴포넌트 레이어**: 버튼(primary/secondary/오행 accent) 등 기초 컴포넌트
