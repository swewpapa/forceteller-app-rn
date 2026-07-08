# Carousel 위젯 (thumbnail/full_image) + Image·AspectRatio 프리미티브 구현 플랜

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development (recommended) 또는 executing-plans로 task-by-task 실행. Steps는 checkbox(`- [ ]`) 추적.

**Goal:** theme 위젯 미구현 2종(`thumbnail_carousel`/`full_image_carousel`)을 shared `AspectRatio`/`Image` 프리미티브 위에 구현하고 스위치에 연결.

**Architecture:** shared 프리미티브(AspectRatio=비율 상자, Image=expo-image 래핑) → theme 카드(ThumbnailCard/FullImageCard) → 공통 셸(CarouselFrame: ListHeader + 가로 FlatList) → 위젯 2종 → theme-widget 스위치 2 case. 스타일 엔진(`withStyleProps`) 소비, 아토믹 조합. 스펙 `docs/superpowers/specs/2026-07-08-carousel-widgets-design.md`.

**Tech Stack:** React Native, expo-image ~56(설치됨), 스타일 엔진(withStyleProps + 리졸버), Figma 실측 완료(§8).

---

## Task 0: 브랜치 + 문서 커밋

**Files:** Create 브랜치, commit 기존 spec/plan.

- [ ] **Step 1: 브랜치 생성** — `git checkout -b feature/carousel-widgets main` (origin/main 최신 pull 후)
- [ ] **Step 2: 문서 커밋**
```bash
git add docs/superpowers/specs/2026-07-08-carousel-widgets-design.md docs/superpowers/plans/2026-07-08-carousel-widgets.md
git commit -m "docs(theme): carousel 위젯 + Image/AspectRatio 스펙·플랜

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```
OTA 문서 등 무관 파일 제외(scoped add).

---

## Task 1: `aspectRatio` 리졸버 (커밋 ② TDD)

**Files:**
- Create: `src/shared/lib/style-engine/resolvers/aspect-ratio.ts`
- Test: `src/shared/lib/style-engine/__tests__/aspect-ratio.test.ts`
- Modify: `src/shared/lib/style-engine/index.ts`

- [ ] **Step 1: 실패 테스트**
```ts
import { aspectRatio } from '../resolvers/aspect-ratio';

describe('aspectRatio resolver', () => {
  it('number를 aspectRatio 스타일로 통과', () => {
    expect(aspectRatio(144 / 92)).toEqual({ aspectRatio: 144 / 92 });
    expect(aspectRatio(1.905)).toEqual({ aspectRatio: 1.905 });
  });
});
```
- [ ] **Step 2: 실패 확인** — `pnpm exec jest aspect-ratio` → FAIL(모듈 없음)
- [ ] **Step 3: 구현**
```ts
// resolvers/aspect-ratio.ts
import type { ViewStyle } from 'react-native';
import type { Resolver } from '../resolver';

/** ratio(w/h number) 통과 — 토큰 아닌 레이아웃 비율(flow/justify 선례). */
export const aspectRatio: Resolver<number> = (value): ViewStyle => ({ aspectRatio: value });
```
- [ ] **Step 4: 배럴** — `index.ts`에 `export { aspectRatio } from './resolvers/aspect-ratio';` 추가
- [ ] **Step 5: 통과 확인** — `pnpm exec jest aspect-ratio` PASS, `pnpm exec tsc --noEmit` 0
- [ ] **Step 6: 커밋**
```bash
git add src/shared/lib/style-engine
git commit -m "feat(style-engine): aspectRatio 리졸버 (TDD)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: `AspectRatio` + `Image` 프리미티브 (커밋 ③)

**Files:**
- Create: `src/shared/components/aspect-ratio/aspect-ratio.tsx`
- Create: `src/shared/components/image/image.tsx`
- Test: `src/shared/components/image/__tests__/image.test.tsx`
- Modify: `src/shared/components/index.ts`

- [ ] **Step 1: `aspect-ratio.tsx`**
```tsx
import { type ComponentProps } from 'react';
import { View } from 'react-native';
import { aspectRatio, background, radius, withStyleProps } from '@/shared/lib/style-engine';

/** 비율 상자 — ratio(w/h number) 유지 + radius/color 토큰. 자식(이미지 등) 주입, overflow:hidden으로 radius 클립. app/en AspectRatio 계승. */
export const AspectRatio = withStyleProps(View, {
  base: { overflow: 'hidden' },
  resolvers: { ratio: aspectRatio, radius, color: background },
});
export type AspectRatioProps = ComponentProps<typeof AspectRatio>;
AspectRatio.displayName = 'AspectRatio';
```
- [ ] **Step 2: `image.tsx`**
```tsx
import { Image as ExpoImage, type ImageContentFit } from 'expo-image';

export type ImageProps = {
  /** 서버 드리븐 uri. null이면 렌더 안 함(부모 AspectRatio color가 빈 배경). */
  source: string | null;
  contentFit?: ImageContentFit;
  accessibilityLabel?: string;
};

/** expo-image 얇은 래핑. 비율/클립은 부모(AspectRatio) 담당 — 채우기 전용. */
export function Image({ source, contentFit = 'cover', accessibilityLabel }: ImageProps) {
  if (!source) return null;
  return (
    <ExpoImage
      source={{ uri: source }}
      contentFit={contentFit}
      accessibilityLabel={accessibilityLabel}
      style={{ width: '100%', height: '100%' }}
    />
  );
}
```
- [ ] **Step 3: Image null 테스트**
```tsx
import { Image } from '../image';
describe('Image', () => {
  it('source가 null이면 null 반환(렌더 안 함)', () => {
    expect(Image({ source: null })).toBeNull();
  });
});
```
- [ ] **Step 4: 배럴** — `shared/components/index.ts`에 `export { AspectRatio, type AspectRatioProps } from './aspect-ratio/aspect-ratio';` + `export { Image, type ImageProps } from './image/image';`
- [ ] **Step 5: 게이트** — `pnpm exec jest image`, `pnpm exec tsc --noEmit` 0, `pnpm exec eslint . --max-warnings=0`
  - ⚠️ 확인: `AspectRatio`의 `color` prop이 `Image`의 없음 — AspectRatio는 배경 상자, Image는 자식. TokenPropsOf 추론이 `ratio`(number)·`radius`(RadiusKey)·`color`(BackgroundKey) 노출하는지 tsc로 확인.
- [ ] **Step 6: 커밋**
```bash
git add src/shared/components/aspect-ratio src/shared/components/image src/shared/components/index.ts
git commit -m "feat(components): AspectRatio + Image 프리미티브

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: 카드 2종 (커밋 ④)

**Files:**
- Create: `src/features/theme/components/thumbnail-card.tsx`
- Create: `src/features/theme/components/full-image-card.tsx`

카드는 순수 presentational(props만). ThemeView 소비. 렌더 검증은 Task 5 시각(이 프로젝트 렌더 테스트 인프라 제한 — theme 테스트는 normalize/api 위주).

- [ ] **Step 1: `thumbnail-card.tsx`** (§8 실측: 폭 144, 이미지 144/92, radius md, gap 카드 12·라벨↔제목 4)
```tsx
import { Pressable, StyleSheet, Text } from 'react-native';
import { AspectRatio, Column, Image } from '@/shared/components';
import { spacing, typographyStyles, useAppColors } from '@/shared/theme';
import type { ThemeView } from '../types/theme-types';

const CARD_WIDTH = 144;
const IMAGE_RATIO = 144 / 92; // Figma 실측(원시 px)

export type ThumbnailCardProps = { view: ThemeView; onPress: () => void };

/** 썸네일 카드: 이미지(144/92) + 라벨(서버색) + 제목(2줄). ListItem 라벨 패턴 계승(crown 아이콘 생략). */
export function ThumbnailCard({ view, onPress }: ThumbnailCardProps) {
  const colors = useAppColors();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.card}>
      <AspectRatio ratio={IMAGE_RATIO} radius="md">
        <Image source={view.thumbnailImage} accessibilityLabel={view.title} />
      </AspectRatio>
      <Column gap="50">
        {view.label ? (
          <Text style={[typographyStyles['label-sm'], { color: view.label.color ?? colors.text.subtle }]}>
            {view.label.text}
          </Text>
        ) : null}
        <Text numberOfLines={2} style={[typographyStyles['headline-xs'], { color: colors.text.default }]}>
          {view.title}
        </Text>
      </Column>
    </Pressable>
  );
}

const styles = StyleSheet.create({ card: { width: CARD_WIDTH, gap: spacing[150] } });
```
- [ ] **Step 2: `full-image-card.tsx`** (§8 실측: 폭 240, 이미지 240/126, radius md, 텍스트 없음)
```tsx
import { Pressable, StyleSheet } from 'react-native';
import { AspectRatio, Image } from '@/shared/components';
import type { ThemeView } from '../types/theme-types';

const CARD_WIDTH = 240;
const IMAGE_RATIO = 240 / 126; // Figma 실측(원시 px)

export type FullImageCardProps = { view: ThemeView; onPress: () => void };

/** 풀이미지 카드: 가로 이미지(240/126)만. 텍스트는 이미지에 구워짐(오버레이 없음). */
export function FullImageCard({ view, onPress }: FullImageCardProps) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.card}>
      <AspectRatio ratio={IMAGE_RATIO} radius="md">
        <Image source={view.fullImage} accessibilityLabel={view.title} />
      </AspectRatio>
    </Pressable>
  );
}

const styles = StyleSheet.create({ card: { width: CARD_WIDTH } });
```
- [ ] **Step 3: 게이트** — `pnpm exec tsc --noEmit` 0, `pnpm exec eslint . --max-warnings=0`. (`Column` gap="50" prop이 SpacingKey 타입 통과 확인.)
- [ ] **Step 4: 커밋**
```bash
git add src/features/theme/components/thumbnail-card.tsx src/features/theme/components/full-image-card.tsx
git commit -m "feat(theme): ThumbnailCard/FullImageCard (Figma 실측 비율)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: CarouselFrame + 위젯 2종 + 스위치 통합 (커밋 ⑤)

**Files:**
- Create: `src/features/theme/components/carousel-frame.tsx`
- Create: `src/features/theme/components/thumbnail-carousel-widget.tsx`
- Create: `src/features/theme/components/full-image-carousel-widget.tsx`
- Modify: `src/features/theme/components/theme-widget.tsx`

- [ ] **Step 1: home-screen 좌우 패딩 확인** — `src/app/**/home-screen.tsx`(theme 위젯 렌더 위치)에서 위젯 좌우 패딩 값을 확인. CarouselFrame FlatList `contentContainerStyle.paddingHorizontal`을 그 값과 맞춰 peek가 화면 엣지에서 자연스럽게 잘리도록. text_only 위젯이 받는 패딩과 동일해야 정렬 일치. (홈이 위젯을 padding 안에 두면 carousel은 그 padding을 상쇄 후 contentContainerStyle로 재적용 — 엣지투엣지 스크롤.)
- [ ] **Step 2: `carousel-frame.tsx`** (§8: 헤더↔carousel 20, 카드 gap 16)
```tsx
import { type ReactElement } from 'react';
import { FlatList } from 'react-native';
import { Column, ListHeader } from '@/shared/components';
import { spacing } from '@/shared/theme';

export type CarouselFrameProps<T> = {
  title: string;
  subtitle?: string;
  data: T[];
  keyExtractor: (item: T) => string;
  renderCard: (item: T) => ReactElement;
};

/** carousel 공통 셸: ListHeader + 가로 FlatList. 헤더에 '모두 보기' 없음(Figma linkMore=false). */
export function CarouselFrame<T>({ title, subtitle, data, keyExtractor, renderCard }: CarouselFrameProps<T>) {
  return (
    <Column gap="250">
      <ListHeader title={title} subtitle={subtitle} />
      <FlatList
        horizontal
        data={data}
        keyExtractor={keyExtractor}
        renderItem={({ item }) => renderCard(item)}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: spacing[200] /*, paddingHorizontal: Step1 값 */ }}
      />
    </Column>
  );
}
```
  - ⚠️ ListHeader 확인: `ListHeader`가 `onPressViewAll` 없이 title/subtitle만 렌더하는지, 자체 하단 패딩이 있는지 읽고 `Column gap="250"`과 중복 안 되게 조정(text_only는 `gap="150"` 사용 중 — Figma는 20이므로 250이 맞으나 ListHeader 내부 패딩과 합산 주의).
- [ ] **Step 3: 위젯 2종**
```tsx
// thumbnail-carousel-widget.tsx
import { CarouselFrame } from './carousel-frame';
import { ThumbnailCard } from './thumbnail-card';
import type { Theme, ThemeView } from '../types/theme-types';

type ThumbnailCarouselTheme = Extract<Theme, { type: 'thumbnail_carousel' }>;
export type ThumbnailCarouselWidgetProps = { theme: ThumbnailCarouselTheme; onPressView: (view: ThemeView) => void };

export function ThumbnailCarouselWidget({ theme, onPressView }: ThumbnailCarouselWidgetProps) {
  return (
    <CarouselFrame
      title={theme.title}
      subtitle={theme.subtitle ?? undefined}
      data={theme.views}
      keyExtractor={(v) => String(v.viewId)}
      renderCard={(v) => <ThumbnailCard view={v} onPress={() => onPressView(v)} />}
    />
  );
}
```
```tsx
// full-image-carousel-widget.tsx — 동일 구조, FullImageCard + Extract<'full_image_carousel'>
import { CarouselFrame } from './carousel-frame';
import { FullImageCard } from './full-image-card';
import type { Theme, ThemeView } from '../types/theme-types';

type FullImageCarouselTheme = Extract<Theme, { type: 'full_image_carousel' }>;
export type FullImageCarouselWidgetProps = { theme: FullImageCarouselTheme; onPressView: (view: ThemeView) => void };

export function FullImageCarouselWidget({ theme, onPressView }: FullImageCarouselWidgetProps) {
  return (
    <CarouselFrame
      title={theme.title}
      subtitle={theme.subtitle ?? undefined}
      data={theme.views}
      keyExtractor={(v) => String(v.viewId)}
      renderCard={(v) => <FullImageCard view={v} onPress={() => onPressView(v)} />}
    />
  );
}
```
- [ ] **Step 4: `theme-widget.tsx` 스위치 2 case 교체** (기존 `return null` → 렌더러. `onPressViewAll`은 carousel 미사용)
```tsx
import { FullImageCarouselWidget } from './full-image-carousel-widget';
import { ThumbnailCarouselWidget } from './thumbnail-carousel-widget';
// ...
    case 'thumbnail_carousel':
      return <ThumbnailCarouselWidget theme={theme} onPressView={onPressView} />;
    case 'full_image_carousel':
      return <FullImageCarouselWidget theme={theme} onPressView={onPressView} />;
```
- [ ] **Step 5: 게이트** — `pnpm test`(기존 유지), `pnpm exec tsc --noEmit` 0(스위치 `never` 가드가 4 case 모두 처리 확인), `pnpm exec eslint . --max-warnings=0`
- [ ] **Step 6: 커밋**
```bash
git add src/features/theme/components
git commit -m "feat(theme): thumbnail/full_image carousel 위젯 + 스위치 통합

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: 최종 리뷰 + 시각 검증 + finishing

- [ ] **Step 1: 최종 통합 리뷰** — main..HEAD 전체. 게이트 재확인, 스펙 정합(§4~§8), 소비처(theme-widget 스위치 외) 무변경, aspectRatio 리졸버 idiom, AspectRatio/Image 프리미티브 계약, 카드 정밀값(144/92·240/126·gap), TokenPropsOf 추론.
- [ ] **Step 2: 시각 검증** — `pnpm ios` 빌드 후 홈에서 thumbnail/full_image carousel 렌더 확인(이미지 로딩·비율·radius·가로 스크롤·peek·라벨색). RNGoogleSignin 네이티브 이슈로 시뮬 막히면 Martin 수동 QA 이연(전례). dev API 인증 없이 200이라 데이터 표시 검증 가능.
- [ ] **Step 3: finishing-a-development-branch** — 게이트 통과 후 Martin에게 push+PR 옵션 제시. **push는 Martin 명시 승인 후.** PR 생성 후 검수.

---

## 범위 밖 (로드맵)

`isNew` 배지, 스냅 스크롤, blurhash placeholder, crown 아이콘(데이터 필드 생기면), Image 단독 radius prop, sizing 리졸버(카드 폭을 style 대신 토큰으로), `/api/theme/{id}` 페이지 컨텍스트, tag_filter 네비게이션.
