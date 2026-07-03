# 치수/타이포 토큰 확장 + Typography 컴포넌트 설계

**작성일:** 2026-07-03
**브랜치:** `feature/typography-component` (예정, main에서 분기)
**관련:** [2026-07-02-design-tokens-color-system-design.md](2026-07-02-design-tokens-color-system-design.md)의 후속. 컴포넌트가 토큰을 소비하는 아키텍처 패턴을 Typography로 처음 확립한다.

---

## Goal

디자인 토큰(spacing/radius/typography)을 codegen 파이프라인에 편입시키고, **컴포넌트가 토큰을 소비하는 표준 패턴**을 `Typography` 컴포넌트로 처음 구현한다. 이 패턴(variant 기반 props + 3단계 탈출구 정책)은 향후 Button/Card 등 다른 컴포넌트가 따를 선례가 된다.

## Architecture (요약)

`tokens.json`(primitive.spacing/radius/typography) → `scripts/generate-tokens.js`(색상 전용이던 `generate-theme.js`를 토큰 전체로 확장) → 공유 스케일(`spacing.ts`/`radius.ts`)은 `theme/generated/`에, Typography 전용 데이터(`generated/typography.ts`)는 `components/Typography/`에 콜로케이트 → `Typography` 컴포넌트가 이를 소비. 컴포넌트는 **variant(필수) + color(text 그룹 한정) + style(레이아웃 탈출구)** 3개 축으로 구성.

## Tech Stack

기존 색상 시스템과 동일 — Node CJS codegen(`scripts/lib/token-codegen.js` 확장), React Native `TextStyle`/`TextProps`.

---

## 배경 / 현황

- 색상 시스템(전 스펙)에서 `assets/design-tokens/tokens.json` → codegen → `ModeColors` 파이프라인이 이미 구축됨. 이번 작업은 같은 파이프라인을 spacing/radius/typography로 확장.
- **레거시 웹(Stencil, `forceteller-app/projects/forceteller-app/src/app/en/components/button.tsx`) 확인 결과**: 컴포넌트는 raw 토큰 값이 아니라 **variant 이름**을 받고, 내부에서 색상+타이포+여백+radius 조합을 룩업한다. `radius`/`spacing`(gap)만 별도 prop으로 인스턴스별 override 허용. 단, 이 레거시는 다른 팔레트(purple 계열)를 쓰므로 **패턴만 참고**, 값은 가져오지 않는다.
- 현재 RN 앱의 `src/shared/components/`는 평면 파일 구조(`screen-container.tsx`, `placeholder-screen.tsx`)이며, Button/Typography 등 토큰 소비 컴포넌트가 전무한 백지 상태.
- 기존 `src/shared/theme/spacing.ts`(수기 작성, `{xs:4, sm:8, md:16, lg:24, xl:32}`)는 토큰의 15단계 숫자 스케일(`50~1000`)과 구조가 다름. 실사용처 3파일·6곳(`home-screen.tsx`, `login-screen.tsx`, `placeholder-screen.tsx`) 확인 — 기존 5개 값이 새 스케일에 정확히 존재(`xs`=4→`50`, `sm`=8→`100`, `md`=16→`200`, `lg`=24→`300`, `xl`=32→`400`)해 시각 변화 없이 치환 가능.
- RN 0.85.3 `TextStyle` 타입 확인(`node_modules/react-native/types_generated/Libraries/StyleSheet/StyleSheetTypes.d.ts`): `fontWeight`는 숫자(700)·문자열(`'700'`) 둘 다 허용(변환 불요). `textDecorationLine`이 정식 prop명이며 토큰의 `textDecoration`과 이름이 다름(변환 필요).
- `primitive.typography`에 변형(variant)이 아닌 키 2개 혼재: `font-family`(문자열, 각 variant에 이미 개별 포함되어 중복), `numeric`(dimension, `value: 0`). 둘 다 `type: "typography"`가 아니므로 생성 대상에서 자동 제외 — 이번 스코프에 영향 없음.
- `radius`의 `sm` 부재는 **Martin 확인 — 의도적 설계**(4단계 `xs/md/lg/xl`만 존재, export 누락 아님).
- **폰트 갭**(전 스펙에서 이미 확인): 토큰의 `fontFamily: "Noto Sans KR"`을 그대로 생성하지만 앱에 폰트 에셋 0개 — 번들링 전까진 RN이 조용히 시스템 폰트로 폴백.

---

## 결정 사항

| 항목 | 결정 | 근거 |
|---|---|---|
| **이번 스코프** | 추상 패턴 설계 + `Typography` 컴포넌트 구현까지 | 사용자 선택. Button 등 다른 컴포넌트는 이 패턴을 따르는 후속 작업 |
| **탈출구 정책 (3단계)** | ① 레이아웃(margin/flex/position)은 `style` prop으로 개방 ② 시각적 정체성(색상/radius/타이포/내부 padding)은 토큰 타입에 묶인 named prop만 ③ 그래도 안 맞으면 디자인 리뷰 거쳐 컴포넌트에 새 variant 추가하거나, 일회성이면 공유 컴포넌트 억지로 안 쓰고 별도 조립 | 사용자 확정. RN 관례(모든 코어 컴포넌트가 `style` 지원)와 디자인 시스템 일관성 사이의 균형 |
| **프리미티브 범위** | `Typography`만. 범용 `Box`(레이아웃 프리미티브)는 만들지 않음 | 사용자 선택. spacing/radius는 "의미"가 아니라 스케일이라 각 컴포넌트가 자기 StyleSheet에서 직접 참조(레거시도 동일). 실사용처 없이 인프라 선구축은 YAGNI 위반 |
| **컴포넌트명** | `Typography` (`Text` 아님) | 사용자 확정. `Text`는 RN 코어 컴포넌트와 이름 충돌 위험(무슨 Text를 import했는지 컴파일러가 못 잡음). `Typography`는 토큰 JSON의 `primitive.typography`와 용어 일치 |
| **파일 구조** | `components/Typography/{Typography.tsx, generated/typography.ts, index.ts}` — 생성물을 컴포넌트 폴더에 콜로케이트 | 사용자 확정. `generated/typography.ts`는 Typography만 쓰는 구현 세부사항이라 소비처 바로 옆에. palette/mode-colors/spacing/radius는 여러 컴포넌트가 공유하므로 `theme/generated/`에 유지. **이 폴더-콜로케이트 패턴은 앞으로 만들 공유 컴포넌트의 표준**으로 삼되, 기존 평면 파일 2개(`screen-container.tsx`, `placeholder-screen.tsx`)는 이번에 마이그레이션하지 않음(관련 없는 리팩토링 회피) |
| **`variant` prop 필수화** | 기본값 없음, 항상 명시 | 디자인 시스템 규율 — 기본값이 있으면 고민 없이 생략하는 습관이 생김 |
| **`color` prop 범위** | `ModeColors['text']`의 7개 키로 제한(`default/subtle/muted/link/alert/force/forceInversed`) | 텍스트에 `background.*`/`primary.*` 같은 부적절한 색상을 타입 레벨에서 차단 |
| **스크립트 리네이밍** | `generate-theme.js`→`generate-tokens.js`, npm `generate:theme`→`generate:tokens` | 사용자 확정. 색상 전용이던 스크립트가 토큰 전체를 다루게 되어 이름과 역할 불일치 해소 |
| **spacing 키 체계** | 토큰의 숫자 키(`50, 100, 150, ... 1000`) 그대로 사용, 시맨틱 이름(`xs/sm/md/lg`) 발명 안 함 | 사용자 확정. 토큰이 정의하지 않은 이름을 우리가 임의로 붙이면 디자인 쪽과 어휘가 갈라짐 |
| **컴포넌트 코드 vs 생성 데이터 구분** | codegen은 데이터 파일만 생성(`generated/typography.ts`). `Typography.tsx` 컴포넌트 코드는 항상 수기 작성 | 사용자 확인 질문에 대한 답 — "컴포넌트를 만드는 스크립트"는 없음. 재료(토큰 데이터)는 자동 생성, 요리(컴포넌트 로직)는 수동 |
| **`radius`/`numeric`/`font-family` 미해결 항목** | 이번 스펙에서 해소하지 않고 이월 | 확인 필요 상태에서 임의로 답을 지어내지 않음(사용자 규칙) |

---

## 상세 설계

### 파일 구조

```
src/shared/theme/
  generated/
    palette.ts / mode-colors.ts   # 기존
    spacing.ts                    # 신규 — 숫자 키 스케일 (15단계)
    radius.ts                     # 신규 — 숫자 키 스케일 (4단계: xs/md/lg/xl)
src/shared/components/
  Typography/
    Typography.tsx                # 신규, 수기 작성
    generated/
      typography.ts                # 신규, 생성물 — Typography 전용 (variant→TextStyle)
    index.ts
  index.ts                        # 기존 배럴에 Typography export 추가
scripts/
  generate-tokens.js              # generate-theme.js에서 리네이밍 + 확장
  lib/token-codegen.js            # buildSpacing/buildRadius/buildTypography 추가
```

### 생성물 계약

```ts
// theme/generated/spacing.ts (발췌)
export const spacing = {
  50: 4, 100: 8, 150: 12, 200: 16, 250: 20, 300: 24, 350: 28,
  400: 32, 450: 36, 500: 40, 600: 48, 700: 56, 800: 64, 900: 72, 1000: 80,
} as const;

// theme/generated/radius.ts (발췌)
export const radius = { xs: 2, md: 8, lg: 16, xl: 99 } as const;

// components/Typography/generated/typography.ts (발췌)
import type { TextStyle } from 'react-native';

export type TypographyVariant =
  | 'headline-lg' | 'headline-md' | 'headline-sm' | 'headline-xs'
  | 'body-lg' | 'body-md' | 'body-sm' | 'body-xs'
  | 'label-lg' | 'label-md' | 'label-sm' | 'label-xs'
  | 'reading-xl' | 'reading-lg' | 'reading-md' | 'reading-sm' | 'reading-xs';

export const typographyStyles: Record<TypographyVariant, TextStyle> = {
  'headline-lg': {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: 700,
    letterSpacing: -1,
    fontFamily: 'Noto Sans KR',
    textDecorationLine: 'none', // 토큰의 textDecoration → RN textDecorationLine 변환
  },
  // ... 16종 동일 구조
};
```

### Codegen 규칙 (기존 색상 규칙에 추가)

1. `buildSpacing(primitive.spacing)`: 각 항목이 `type: "dimension"`인지 검증 후 숫자 키 그대로 record 생성.
2. `buildRadius(primitive.radius)`: 위와 동일 로직 재사용(둘 다 "flat dimension record"라 공통 함수로 묶는다).
3. `buildTypography(primitive.typography)`: `type === "typography"`인 항목만 필터링(그 외 `font-family`/`numeric`은 무시). 각 항목의 값 객체에서 `textDecoration` 키를 `textDecorationLine`으로 리네이밍해 출력. `fontWeight`는 원본 숫자값 그대로 출력(RN 타입이 숫자 리터럴 허용 확인됨).
4. 검증 실패 시 생성 중단(기존 원칙 유지): dimension이 숫자가 아니거나, typography 항목에 알 수 없는 필드가 섞이면 에러.
5. `package.json`: `"generate:tokens": "node scripts/generate-tokens.js"`(`generate:theme` 대체).

### Typography 컴포넌트

```tsx
// components/Typography/Typography.tsx (설계 — 구현은 플랜에서)
type TypographyProps = {
  variant: TypographyVariant;              // 필수, 기본값 없음
  color?: keyof ModeColors['text'];        // 기본 'default'
  style?: StyleProp<TextStyle>;            // 레이아웃 탈출구 — 병합 순서상 마지막
} & Omit<TextProps, 'style' | 'children'> & { children: ReactNode };
```

- 스타일 병합 순서: `[typographyStyles[variant], { color: colors.text[color ?? 'default'] }, style]` — `style`이 항상 마지막이라 탈출구 정책과 일치.
- `numberOfLines`, `onPress`, `accessibilityRole` 등 나머지 RN `TextProps`는 `...rest`로 그대로 전달.
- `ScreenContainer`/`PlaceholderScreen`과 같은 `useMemo` 기반 `makeStyles` 관례는 여기선 불필요 — `typographyStyles`가 이미 정적 룩업 테이블이라 컴포넌트 리렌더와 무관.

### 기존 `spacing.ts` 마이그레이션

| 파일 | 변경 |
|---|---|
| `home-screen.tsx` (2곳: `spacing.lg`×2, `spacing.sm`×1) | `spacing.lg`→`spacing[300]`, `spacing.sm`→`spacing[100]` |
| `login-screen.tsx` (2곳) | `spacing.lg`→`spacing[300]`, `spacing.md`→`spacing[200]` |
| `placeholder-screen.tsx` (2곳) | `spacing.lg`→`spacing[300]`, `spacing.sm`→`spacing[100]` |
| `src/shared/theme/spacing.ts` | 삭제, `theme/generated/spacing.ts`로 대체. `theme/index.ts`의 export 경로 갱신 |

시각 변화 0(전부 동일 px 값으로 매핑).

### 테스트 전략

- `token-codegen.test.js`에 `buildSpacing`/`buildRadius`/`buildTypography` 단위 테스트 추가(기존 색상 테스트와 동일한 스타일: 정상 케이스 + 검증 실패 케이스).
- `textDecoration`→`textDecorationLine` 변환, `font-family`/`numeric` 제외 로직은 명시적 테스트 케이스로 고정.
- `Typography` 컴포넌트 자체는 리액트 컴포넌트 테스트 인프라 부재(기존 방침 유지)로 자동 테스트 없음 — 플랜의 수동 검증 단계에서 확인.

---

## 확인 필요 / 범위 밖 (명시)

| 항목 | 상태 |
|---|---|
| `typography.numeric`의 용도 | 미해결, 다음 세션 이월 — Martin 추정: 숫자 + 뒤에 unit을 붙이는 구조(레거시 `NumericText`류 컴포넌트 관련 가능성). 확정 아님, 이번 스코프엔 영향 없음(생성 대상에서 이미 제외) |
| 폰트 번들링(Noto Sans KR) | 범위 밖 — 별도 로드맵 항목, 이번 작업은 코드 준비만 완료 |
| `Box`/레이아웃 프리미티브 | 범위 밖 — 실사용처 발생 시 재검토 |
| 섀도 토큰 | 범위 밖 — RN 크로스플랫폼 구현 방식 미확인(전 스펙에서 이월) |
| 기존 평면 컴포넌트 파일 폴더 구조 전환 | 범위 밖 — 신규 컴포넌트만 새 구조 적용, 기존 파일은 자연 교체 시점에 |

## 후속 로드맵

1. **Button 등 인터랙티브 컴포넌트**: 이번에 확립한 variant 패턴(레거시 Button 참고)을 따라 개별 구현. 공용 "variant 헬퍼"는 두 번째 컴포넌트가 실제로 나온 뒤 중복이 확인되면 그때 추출.
2. **섀도**: RN 구현 방식 결정 후 컴포넌트 레이어에 편입.
3. **테마 토글 UI / 웹뷰 동기화**: 색상 시스템 스펙에서 이월된 항목, 계속 대기.
