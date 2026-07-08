# Carousel 위젯 (thumbnail/full_image) + Image·AspectRatio 프리미티브

> 2026-07-08 브레인스토밍 확정본. theme 위젯 4종 중 미구현 2종(`thumbnail_carousel`/`full_image_carousel`)을 완성한다. 둘 다 이미지 기반이라 **비율 상자(AspectRatio) + 이미지(Image) 프리미티브**를 shared에 선행 구축한다. [[theme-widget-feature]] 연장, [[style-engine]] 엔진 소비, [[component-prop-conventions]] 아토믹 조합.

## 1. 목표

- shared 프리미티브 2종 신설: **`AspectRatio`**(비율 상자, 엔진 기반), **`Image`**(expo-image 얇은 래핑).
- theme 위젯 2종 신설: **`ThumbnailCarouselWidget`**, **`FullImageCarouselWidget`** — 공통 셸 `CarouselFrame`(ListHeader + 가로 FlatList) + 카드 분기.
- `theme-widget.tsx` 스위치의 `thumbnail_carousel`/`full_image_carousel` case를 `null`에서 실제 렌더러로 교체(`never` 가드가 이미 대기).

## 2. 배경 · 참조

`ThemeView`(theme-types.ts)는 이미 `thumbnailImage`/`fullImage`/`title`/`subtitle`/`label{text,color}`/`link`/`isNew`를 갖는다. carousel은 이 배열을 가로로 렌더한다.

**참조 조사(2026-07-08)**:
- `forceteller-app3` `fixed-ratio`(Angular): `padding-top %` 트릭 + inner absolute fill, `[ratio]="w:h"` 문자열, 이미지는 content projection. 구형 호환 방식.
- `forceteller-app/en` `AspectRatio`(React+StyleX): 네이티브 CSS `aspect-ratio`, `ratio` 유연 형식, `radius`/`color`/`width`/`fluid`를 Surface(스타일 시스템)로 통합. **최신 후속 버전이자 우리와 가장 가까운 참조.**
- 공통 철학: **"이미지 URL을 직접 받지 않고 비율 상자만 제공, 이미지는 자식으로 주입"**.

**RN 대응**: RN(Yoga)은 `style.aspectRatio`(number)를 네이티브 지원 → app3의 padding 트릭 불필요. app/en `AspectRatio`처럼 네이티브 방식 + 우리 `withStyleProps` 엔진(radius/background 바인딩)을 얹는다.

## 3. 컴포넌트 구조 (파일)

```
src/shared/components/
  aspect-ratio/aspect-ratio.tsx        신규 — 비율 상자 프리미티브
  image/image.tsx                      신규 — expo-image 래핑
  index.ts                             배럴에 AspectRatio/Image 추가
src/shared/lib/style-engine/
  resolvers/aspect-ratio.ts            신규 — ratio 통과 리졸버
  index.ts                             배럴에 aspectRatio 리졸버 추가
src/features/theme/components/
  carousel-frame.tsx                   신규 — ListHeader + 가로 FlatList 공통 셸
  thumbnail-card.tsx                   신규 — 이미지+라벨+제목 세로 카드
  full-image-card.tsx                  신규 — 가로 이미지 카드
  thumbnail-carousel-widget.tsx        신규 — CarouselFrame + ThumbnailCard
  full-image-carousel-widget.tsx       신규 — CarouselFrame + FullImageCard
  theme-widget.tsx                     수정 — 2 case를 null→렌더러
```

## 4. `AspectRatio` 프리미티브

app/en `AspectRatio` 계승. 엔진 기반 — 비율 유지 상자에 radius/background를 토큰 바인딩.

```tsx
// resolvers/aspect-ratio.ts — ratio는 토큰 아님(임의 number 통과, alignment 리졸버 선례)
export const aspectRatio: Resolver<number> = (value) => ({ aspectRatio: value });

// shared/components/aspect-ratio/aspect-ratio.tsx
const aspectRatioResolvers = { ratio: aspectRatio, radius, color: background };
export const AspectRatio = withStyleProps(View, {
  base: { overflow: 'hidden' }, // radius 클립 + 자식 이미지 넘침 방지
  resolvers: aspectRatioResolvers,
});
export type AspectRatioProps = ComponentProps<typeof AspectRatio>;
```

- **`ratio` = number**(`ratio={3/2}`). RN `aspectRatio`가 number이고 TS 타입 안전 — app/en의 문자열 유연 파싱(`"3:2"`)은 웹 편의 계보라 미채택(근거: RN/TS 정합). 소비처는 `w/h` 산술로 표현.
- `radius`(RadiusKey)·`color`(background 그룹키)는 엔진 바인딩 재사용. `overflow:'hidden'` base로 radius가 자식 이미지를 클립.
- 자식 주입(children). 이미지 외 스켈레톤/배경에도 재사용 가능한 범용 상자.

## 5. `Image` 프리미티브

expo-image(~56 설치됨) 얇은 래핑. 비율/클립은 부모 `AspectRatio`가 담당하므로 Image는 **채우기 + fit**만.

```tsx
// shared/components/image/image.tsx
import { Image as ExpoImage, type ImageContentFit } from 'expo-image';

export type ImageProps = {
  source: string | null;              // uri 문자열(서버 드리븐). null이면 렌더 안 함(placeholder 배경은 AspectRatio color)
  contentFit?: ImageContentFit;       // 기본 'cover'
  accessibilityLabel?: string;
};

export function Image({ source, contentFit = 'cover', accessibilityLabel }: ImageProps) {
  if (!source) return null;           // null 이미지 → AspectRatio의 color 배경이 노출
  return (
    <ExpoImage
      source={{ uri: source }}
      contentFit={contentFit}
      accessibilityLabel={accessibilityLabel}
      style={{ width: '100%', height: '100%' }}   // AspectRatio 상자를 꽉 채움
    />
  );
}
```

- expo-image가 `aspectRatio` style도 받지만, **비율 책임은 AspectRatio에 단일화**(Image는 채우기 전용) — 참조의 "상자/콘텐츠 분리" 철학 유지.
- `transition`/blurhash placeholder는 YAGNI 후속. null source는 조기 반환(AspectRatio `color`가 스켈레톤/빈 배경 역할).

## 6. `CarouselFrame` + 카드 2종

```tsx
// carousel-frame.tsx — 공통 셸
export type CarouselFrameProps<T> = {
  title: string;
  subtitle?: string;
  onPressViewAll?: () => void;
  data: T[];
  keyExtractor: (item: T) => string;
  renderCard: (item: T) => ReactElement;
};

export function CarouselFrame<T>({ title, subtitle, onPressViewAll, data, keyExtractor, renderCard }: CarouselFrameProps<T>) {
  return (
    <Column gap="150">
      <ListHeader title={title} subtitle={subtitle} onPressViewAll={onPressViewAll} />
      <FlatList
        horizontal
        data={data}
        keyExtractor={keyExtractor}
        renderItem={({ item }) => renderCard(item)}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: <구현 시 확정>, gap: <구현 시 확정> }}
      />
    </Column>
  );
}
```

- **ListHeader 재사용**(text_only와 동일). `Column gap="150"` 래핑 일관.
- 가로 스크롤 = `FlatList horizontal`(정석 — key/renderItem, 소량이지만 일관). peek = `contentContainerStyle` 좌우 padding + 카드 gap. **스냅은 미적용**(스크린샷상 자유 스크롤) — 필요 시 후속.
- 카드 폭은 카드 컴포넌트가 고정(thumbnail 좁게, full 넓게+peek).

**ThumbnailCard** — 세로 카드: `AspectRatio ratio={<thumbnail 비율>} radius>Image(thumbnailImage)` + label("프리미엄 👑" = `label.text`+`label.color` 색상 Typography + 왕관 아이콘, 인라인) + title(Typography, 2~3줄). `onPress`→`onPressView(view)`. 고정 폭.

**FullImageCard** — `AspectRatio ratio={<full 비율>} radius>Image(fullImage)`만. 텍스트 오버레이 없음(이미지에 구워짐). `onPress`→`onPressView(view)`. 넓은 폭(화면-패딩, peek).

## 7. 데이터 매핑 · 스위치 통합

```tsx
// theme-widget.tsx (기존 null 두 case 교체)
case 'thumbnail_carousel':
  return <ThumbnailCarouselWidget theme={theme} onPressView={onPressView} onPressViewAll={onPressViewAll ? () => onPressViewAll(theme) : undefined} />;
case 'full_image_carousel':
  return <FullImageCarouselWidget theme={theme} onPressView={onPressView} onPressViewAll={onPressViewAll ? () => onPressViewAll(theme) : undefined} />;
```

- 위젯은 `theme.views`를 `CarouselFrame`에 넘기고 `renderCard`로 카드 주입. `keyExtractor`=`view.viewId`.
- 이미지 필드: ThumbnailCard=`view.thumbnailImage`, FullImageCard=`view.fullImage`. null이면 Image가 조기 반환 → AspectRatio 배경 노출.
- **`isNew` 배지는 Figma에 없어 생략**(데이터는 보존, 후속). label은 ThumbnailCard만(full은 텍스트 없음).

## 8. 정밀 치수 (2026-07-08 `get_design_context` 실측 완료)

Figma 값이 우리 토큰과 **1:1 매핑**됨(spacing 50~1000, radius md=8, typography headline-md/xs·label-sm 전부 확인).

| 항목 | 실측 | 우리 표현 |
|---|---|---|
| thumbnail 이미지 | 144×92 → aspectRatio **144/92**(≈1.565) | `width:144`(원시 px), `radius="md"` |
| full_image 이미지 | 240×126 → aspectRatio **240/126**(≈1.905) | `width:240`(원시 px), `radius="md"` |
| carousel 카드 gap | 16 | `200` |
| thumbnail 이미지↔텍스트 gap | 12 | `150` |
| thumbnail 라벨↔제목 gap | 4 | `50` |
| 헤더↔carousel 여백 | 20 | `250` (text_only는 150 사용 중 — ListHeader 구조 확인) |
| 테마 제목 | Bold 22/28 | `headline-md` |
| 아이템 제목 | Medium 16/24, 2줄 | `headline-xs` |
| 라벨 | Medium 12/16 | `label-sm` |
| 라벨 색 | 서버 `label.color` hex | ListItem 패턴(`labelColor ?? text.subtle`) |

- **헤더 `linkMore=false`** — carousel 2종 모두 "모두 보기" 없음 → `onPressViewAll` 미사용(§6/§7에서 제거). text_only만 유지.
- **crown 아이콘 생략** — ListItem이 이미 아이콘 없이 label 텍스트만 렌더하고, 데이터(`label{text,color}`)에 아이콘 필드가 없음. Figma crown은 "프리미엄" 예시 장식. carousel 카드도 ListItem과 동일(label-sm + labelColor). 아이콘은 데이터 필드 생기면 후속.
- 카드 폭(144/240)은 토큰 아닌 **원시 px**(Figma 고정폭). peek는 카드폭 < 화면폭으로 자연 발생. FlatList `contentContainerStyle` 좌우 padding = 홈 컨테이너 패딩과 정합(구현 시).

## 9. 사이드이펙트

- shared 배럴에 `AspectRatio`/`Image` 추가 — 신규 export라 기존 소비처 무영향.
- 스타일 엔진 배럴에 `aspectRatio` 리졸버 추가(additive).
- `theme-widget.tsx` 두 case 교체 — 기존 text_only/keyword_cloud 무변경, `never` 가드 유지(이제 4 case 모두 실렌더).
- 홈 3리전에서 `thumbnail_carousel`/`full_image_carousel` type이 서버에서 오면 이제 렌더됨(현재는 null이라 빈 자리) — 시각 변화 발생, QA 대상.
- `expo-image` 신규 소비 — 이미 설치됨(추가 의존성 없음).

## 10. 테스트

- `aspectRatio` 리졸버 단위 테스트(값 통과 + 미지정 무방출은 composeStyles 중앙 가드).
- `Image` null source 조기 반환 테스트.
- normalize/위젯 렌더 테스트는 기존 theme 테스트 패턴 계승 — carousel 위젯이 views를 카드로 매핑, 스위치 case 도달.
- FlatList 실렌더·스크롤·이미지 로딩은 시각 검증(RNGoogleSignin 네이티브 이슈 시 Martin QA 이연 — 전례).

## 11. 범위 밖 (로드맵)

- `isNew` 배지, 스냅 스크롤, blurhash placeholder/transition.
- Image 단독 radius prop(현재 AspectRatio가 클립 담당) — 단독 사용처 생기면.
- `/api/theme/{id}` 페이지 컨텍스트, tag_filter 네비게이션(기존 후속).
- shared 가로스크롤 프리미티브 추출(소비처 theme뿐이라 YAGNI).
