# theme 위젯/컴포넌트 분류 재정비 구현 플랜

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `features/theme`을 데이터 결합 축으로 재조직 — `widgets/`(useQuery 결합) vs `components/`(순수), 순수 컴포넌트의 `-widget` 접미사 제거, `ThemeWidget` 이름을 query 컴포넌트가 승계.

**Architecture:** 순수 리네임/이동 리팩터(렌더 결과 불변). 같은 심볼(`ThemeWidget`)의 의미가 바뀌므로 3커밋으로 이름 충돌 구간 제거: ① 순수 정리(이름 비우기) → ② 위젯 승격(이름 승계) → ③ 문서. 스펙: `docs/superpowers/specs/2026-07-15-theme-widget-taxonomy-design.md`

**Tech Stack:** RN 0.85 / TypeScript / `git mv` 히스토리 보존 / 검증 = `tsc --noEmit` + `eslint src` + `jest`

**제약:** push 금지(Martin 명시 요청 시에만). PR 생성도 지시 대기. 커밋 트레일러 `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

---

### Task 0: 선행 조건 + 브랜치 + 문서 커밋 ⓪

**Files:**
- Commit: `docs/superpowers/specs/2026-07-15-theme-widget-taxonomy-design.md`, `docs/superpowers/plans/2026-07-15-theme-widget-taxonomy.md`

- [ ] **Step 0-1: 선행 조건 확인 — Martin WIP 해소**

Run: `git status --short`
Expected: `src/features/home/screens/home-screen.tsx`가 `M`이 **아니어야** 한다 (Martin의 dev 링크 제거 WIP가 커밋된 상태). `M`이면 **BLOCKED — Martin에게 확인**. untracked(`??`) 문서/ota-poc는 무관.

- [ ] **Step 0-2: main에서 브랜치 생성**

```bash
git switch main
git switch -c refactor/theme-widget-taxonomy
```

- [ ] **Step 0-3: 스펙+플랜 문서 커밋 ⓪**

```bash
git add docs/superpowers/specs/2026-07-15-theme-widget-taxonomy-design.md docs/superpowers/plans/2026-07-15-theme-widget-taxonomy.md
git commit -m "docs(theme): 위젯/컴포넌트 분류 재정비 스펙+플랜

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 1: 순수 컴포넌트 정리 (커밋 ①) — `ThemeWidget` 이름 비우기

**Files:**
- Rename: `src/features/theme/components/theme-widget.tsx` → `theme-renderer.tsx` (심볼 `ThemeWidget`→`ThemeRenderer`)
- Rename: `text-only-widget.tsx` → `text-only.tsx` (`TextOnlyWidget`→`TextOnly`)
- Rename: `keyword-cloud-widget.tsx` → `keyword-cloud.tsx` (`KeywordCloudWidget`→`KeywordCloud`)
- Rename: `thumbnail-carousel-widget.tsx` → `thumbnail-carousel.tsx` (`ThumbnailCarouselWidget`→`ThumbnailCarousel`)
- Rename: `full-image-carousel-widget.tsx` → `full-image-carousel.tsx` (`FullImageCarouselWidget`→`FullImageCarousel`)
- Modify: `theme-widget-list.tsx` (임포트만 — Task 2에서 삭제되지만 커밋 ①이 컴파일돼야 함)
- 카드 2종(`thumbnail-card.tsx`, `full-image-card.tsx`)·배럴·홈은 **무변경**

- [ ] **Step 1-1: git mv 5건**

```bash
cd src/features/theme/components
git mv theme-widget.tsx theme-renderer.tsx
git mv text-only-widget.tsx text-only.tsx
git mv keyword-cloud-widget.tsx keyword-cloud.tsx
git mv thumbnail-carousel-widget.tsx thumbnail-carousel.tsx
git mv full-image-carousel-widget.tsx full-image-carousel.tsx
```

- [ ] **Step 1-2: theme-renderer.tsx 심볼/임포트 갱신** (전체 내용)

```tsx
import type { Theme, ThemeKeyword, ThemeView } from '@/features/theme/types/theme-types';
import { FullImageCarousel } from './full-image-carousel';
import { KeywordCloud } from './keyword-cloud';
import { TextOnly } from './text-only';
import { ThumbnailCarousel } from './thumbnail-carousel';

export type ThemeRendererProps = {
  theme: Theme;
  onPressView: (view: ThemeView) => void;
  onPressViewAll?: (theme: Theme) => void;
  onPressKeyword?: (keyword: ThemeKeyword) => void;
};

/**
 * 테마 type → 순수 변형 스위치 (레거시 SectionComponentRenderer 대응).
 * 4개 변형(text_only/keyword_cloud/thumbnail_carousel/full_image_carousel)을 모두 렌더한다.
 * default의 never 가드: 컴포넌트 반환 타입이 undefined를 허용해 fall-through가 컴파일되므로,
 * 새 변형 타입이 union에 추가되면 여기서 컴파일 에러로 잡아 case 누락을 강제한다.
 */
export function ThemeRenderer({
  theme,
  onPressView,
  onPressViewAll,
  onPressKeyword,
}: ThemeRendererProps) {
  switch (theme.type) {
    case 'text_only':
      return <TextOnly theme={theme} onPressView={onPressView} onPressViewAll={onPressViewAll} />;
    case 'keyword_cloud':
      return <KeywordCloud theme={theme} onPressKeyword={onPressKeyword ?? (() => undefined)} />;
    case 'thumbnail_carousel':
      return <ThumbnailCarousel theme={theme} onPressView={onPressView} />;
    case 'full_image_carousel':
      return <FullImageCarousel theme={theme} onPressView={onPressView} />;
    default: {
      const _exhaustive: never = theme;
      return _exhaustive;
    }
  }
}
```

- [ ] **Step 1-3: 변형 4종 심볼 갱신** — 각 파일에서 `<X>Widget`→`<X>`, `<X>WidgetProps`→`<X>Props`, 주석 "위젯"→"변형". 예: text-only.tsx

```tsx
import { Column, ListHeader, ListItem } from '@/shared/components';
import type { Theme, ThemeView } from '@/features/theme/types/theme-types';

type TextOnlyTheme = Extract<Theme, { type: 'text_only' }>;

export type TextOnlyProps = {
  theme: TextOnlyTheme;
  onPressView: (view: ThemeView) => void;
  onPressViewAll?: (theme: TextOnlyTheme) => void;
};

/** text_only 변형: ListHeader + 라벨/제목 텍스트 행 목록. */
export function TextOnly({ theme, onPressView, onPressViewAll }: TextOnlyProps) {
  return (
    <Column gap="150">
      <ListHeader
        title={theme.title}
        subtitle={theme.subtitle ?? undefined}
        onPressViewAll={onPressViewAll ? () => onPressViewAll(theme) : undefined}
      />
      <Column>
        {theme.views.map((view) => (
          <ListItem
            key={view.viewId}
            label={view.label?.text}
            labelColor={view.label?.color}
            title={view.title}
            onPress={() => onPressView(view)}
          />
        ))}
      </Column>
    </Column>
  );
}
```

나머지 3종 동일 패턴 (`KeywordCloudWidget→KeywordCloud`, `ThumbnailCarouselWidget→ThumbnailCarousel`, `FullImageCarouselWidget→FullImageCarousel`; 내부 로직·`Extract` 로컬 타입·카드 임포트는 무변경).

- [ ] **Step 1-4: theme-widget-list.tsx 임포트 갱신** (파일 유지, 임포트/JSX만)

```tsx
import { Column } from '@/shared/components';
import type { Theme, ThemeView } from '@/features/theme/types/theme-types';
import { ThemeRenderer } from './theme-renderer';

export type ThemeWidgetListProps = {
  themes: Theme[];
  onPressView: (view: ThemeView) => void;
  onPressViewAll?: (theme: Theme) => void;
};

/** 위젯 세로 나열. 스크롤 컨테이너는 화면(호출부) 관할. */
export function ThemeWidgetList({ themes, onPressView, onPressViewAll }: ThemeWidgetListProps) {
  return (
    <Column gap="400">
      {themes.map((theme) => (
        <ThemeRenderer
          key={theme.uuid}
          theme={theme}
          onPressView={onPressView}
          onPressViewAll={onPressViewAll}
        />
      ))}
    </Column>
  );
}
```

- [ ] **Step 1-5: 검증**

Run: `npx tsc --noEmit && npx eslint src && npx jest`
Expected: 전부 통과 (기존 8 suites — theme 테스트는 api만 참조).

- [ ] **Step 1-6: 잔여 참조 0 확인**

Run: `grep -rn "Widget" src/features/theme/components/`
Expected: `ThemeWidgetList`(list 파일, Task 2에서 삭제 예정)만 출력. 변형/디스패처의 `-Widget` 심볼 잔존 없음.

- [ ] **Step 1-7: 커밋 ①**

```bash
git add src/features/theme/components/
git commit -m "refactor(theme): 순수 컴포넌트 정리 — ThemeRenderer 리네임 + 변형 -widget 접미사 탈락

위젯(useQuery 결합)이 아닌 순수 컴포넌트에서 widget 어휘 제거:
- 디스패처 ThemeWidget → ThemeRenderer (레거시 SectionComponentRenderer 대응)
- 변형 4종 접미사 탈락: TextOnly/KeywordCloud/ThumbnailCarousel/FullImageCarousel
이 커밋으로 ThemeWidget 이름이 비워짐 — 커밋 ②에서 query 컴포넌트가 승계.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: 위젯 승격 (커밋 ②) — query 컴포넌트가 `ThemeWidget` 승계

**Files:**
- Rename+rewrite: `components/theme-widget-list-by-code.tsx` → `widgets/theme-widget.tsx` (리스트 흡수)
- Delete: `components/theme-widget-list.tsx`
- Modify: `src/features/theme/index.ts` (배럴)
- Modify: `src/features/home/screens/home-screen.tsx` (2줄)

- [ ] **Step 2-1: widgets/ 신설 + git mv**

```bash
mkdir -p src/features/theme/widgets
git mv src/features/theme/components/theme-widget-list-by-code.tsx src/features/theme/widgets/theme-widget.tsx
git rm src/features/theme/components/theme-widget-list.tsx
```

- [ ] **Step 2-2: widgets/theme-widget.tsx 재작성** (리스트 흡수, 전체 내용)

```tsx
import { ActivityIndicator } from 'react-native';
import { Button, Column, Typography } from '@/shared/components';
import { useThemeListByCode } from '@/features/theme/hooks/useThemeListByCode';
import type { ThemeView } from '@/features/theme/types/theme-types';
import { ThemeRenderer } from '@/features/theme/components/theme-renderer';

export type ThemeWidgetProps = {
  code: string;
  onPressView: (view: ThemeView) => void;
};

/**
 * 테마 위젯: code로 Theme[]를 자체 페칭해 변형들을 세로 나열한다.
 * feature 유일의 query 결합 컴포넌트(widgets/) — 순수 컴포넌트는 components/.
 * 리전마다 독립 로딩/에러 — 한 리전이 느려도 나머지는 먼저 표시된다.
 */
export function ThemeWidget({ code, onPressView }: ThemeWidgetProps) {
  const query = useThemeListByCode(code);

  if (query.isPending) {
    return <ActivityIndicator />;
  }
  if (query.isError) {
    return (
      <Column gap="150">
        <Typography variant="body-md" color="subtle">
          테마를 불러오지 못했어요.
        </Typography>
        <Button
          label="다시 시도"
          color="secondary"
          appearance="outline"
          size="sm"
          onPress={() => query.refetch()}
        />
      </Column>
    );
  }
  return (
    <Column gap="400">
      {query.data.map((theme) => (
        <ThemeRenderer key={theme.uuid} theme={theme} onPressView={onPressView} />
      ))}
    </Column>
  );
}
```

주의: 구 리스트의 `onPressViewAll` 배관은 흡수 시 제거(외부 배선 0이던 죽은 prop). `ThemeRenderer`의 optional prop은 유지.

- [ ] **Step 2-3: 배럴 갱신** — `src/features/theme/index.ts` 전체 내용

```ts
export { ThemeWidget } from './widgets/theme-widget';
export type { Theme, ThemeView, ThemeKeyword, ThemeLink } from './types/theme-types';
```

(`useThemeListByCode`·`ThemeWidgetList`·`ThemeWidgetListByCode` export 제거 — 외부 소비 0 확인됨.)

- [ ] **Step 2-4: home-screen.tsx 갱신** (2줄 — Martin WIP 커밋 후 내용 기준으로 매칭)

```tsx
// import 줄
import { ThemeWidget, type ThemeView } from '@/features/theme';
// JSX (THEME_CODES.map 내부)
<ThemeWidget key={code} code={code} onPressView={handlePressView} />
```

- [ ] **Step 2-5: 검증 + 잔여 참조 0 확인**

Run: `npx tsc --noEmit && npx eslint src && npx jest`
Expected: 전부 통과.
Run: `grep -rn "ThemeWidgetList\|ListByCode" src`
Expected: 출력 없음.

- [ ] **Step 2-6: 커밋 ②**

```bash
git add src/features/theme/ src/features/home/screens/home-screen.tsx
git commit -m "refactor(theme): 위젯 승격 — query 컴포넌트가 ThemeWidget 승계, widgets/ 신설

- theme-widget-list-by-code → widgets/theme-widget.tsx: 위젯 = useQuery 결합 컴포넌트
- 순수 리스트(ThemeWidgetList) 흡수 — 외부 소비 0 + 미배선 onPressViewAll 배관 제거
- 컴포넌트 이름의 조회방법 노출(ByCode) 제거 — architecture.md 네이밍 원칙 부합
- 배럴 최소화: ThemeWidget + 타입 4종만 (useThemeListByCode도 외부 소비 0)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: 문서 개정 (커밋 ③)

**Files:**
- Modify: `docs/architecture.md` (트리 1줄 + 폴더 규약 절 신설 + 네이밍 표 1행 + 어휘 절 2불릿)
- Modify: `CLAUDE.md` (요약 2불릿)

- [ ] **Step 3-1: architecture.md — 트리에 widgets/ 추가** (36행)

old: `│      └─ { api/ screens/ components/ hooks/ stores/ types/ } + index.ts(barrel)`
new: `│      └─ { api/ screens/ widgets/ components/ hooks/ stores/ types/ } + index.ts(barrel)`

- [ ] **Step 3-2: architecture.md — 폴더 규약 절 신설** ("위반 시 lint 에러…zones에 해당 feature 줄을 추가한다." 문단 바로 뒤)

```markdown
### feature 내부 폴더 규약: widgets/ vs components/ (2026-07-15)

feature 내부 컴포넌트는 **데이터 결합 축**으로 나눈다 (판정 기준: `useQuery`/store 구독 유무 — 이진):

- **`widgets/`** — query가 결합된(자체 페칭) 컴포넌트. "스크린이 훅 호출" 규칙의 승인된 예외(예: 홈 리전별 독립 로딩)를 구조로 표시한다.
- **`components/`** — 순수(presentational) 컴포넌트. props만 소비하고 mock 없이 테스트·재사용 가능해야 하며, `-widget` 접미사를 붙이지 않는다.
- `shared/components`에는 이 축을 적용하지 않는다 — container가 존재하지 않는 레이어라 변별력이 없다(컴포넌트 종류별 조직 유지).
- 첫 적용: theme(2026-07-15). premium 등 기존 feature의 동일 미스네이밍(`PremiumWidget`)은 후속 정리.
```

- [ ] **Step 3-3: architecture.md — 네이밍 표 컴포넌트 행 예시 교체** (85행)

old: `| 컴포넌트 | 도메인 개념 | 데이터 조회 방법이 아니라 개념을 렌더 | \`ThemeWidget\`, \`ThemeWidgetList\`, \`TextOnlyWidget\` |`
new: `| 컴포넌트 | 도메인 개념 | 데이터 조회 방법이 아니라 개념을 렌더 | \`ThemeWidget\`, \`ThemeRenderer\`, \`TextOnly\` |`

- [ ] **Step 3-4: architecture.md — theme 어휘 절 2불릿 개정** (90행·93행)

90행 old: `- **컴포넌트 = \`ThemeWidget*\`**: …` (전체 불릿)
90행 new:

```markdown
- **위젯 = query 결합 컴포넌트**: `ThemeWidget`(`widgets/`)이 `useThemeListByCode`로 `Theme[]`를 자체 페칭해 렌더한다 — feature에서 useQuery를 갖는 유일한 컴포넌트. 순수 컴포넌트는 `components/`: 디스패처 `ThemeRenderer`(type→변형 스위치), 접미사 없는 룩 네이밍 변형(`TextOnly`/`KeywordCloud`/`ThumbnailCarousel`/`FullImageCarousel`), 조각(`ThumbnailCard`/`FullImageCard`). 응답의 `type` 필드(`text_only`/`thumbnail_carousel`/`full_image_carousel`/`keyword_cloud`)는 콘텐츠 분류가 아니라 **변형 렌더러 지시자**다.
```

93행 old: `- "위젯(widget)"은 React 생태계 용어가 아니라 **팀 도메인 용어**다 (컴포넌트 일반을 widget이라 부르지 않는다).`
93행 new: `- "위젯(widget)"은 React 생태계 용어가 아니라 **팀 도메인 용어**다: **useQuery가 결합된(자체 페칭) 컴포넌트**만 위젯이라 부른다. 순수 컴포넌트는 크기와 무관하게 widget이 아니다.`

- [ ] **Step 3-5: CLAUDE.md — 요약 2불릿 갱신**

theme 어휘 불릿(13행) new:

```markdown
- **theme 도메인 어휘**: 엔티티 = `Theme`(두 컨텍스트 공유). **위젯 = useQuery 결합 컴포넌트**(`widgets/ThemeWidget`), 순수는 `components/`(디스패처 `ThemeRenderer` + 접미사 없는 변형 `TextOnly` 등). 컨텍스트 구분은 훅 이름(`listByCode` vs 향후 `getById`)이 한다. `ThemeList` 타입은 중의적이라 만들지 않는다(응답은 `Theme[]`).
```

데이터 페칭 불릿 new:

```markdown
- **데이터 페칭**: 스크린이 훅 호출(컨테이너), 하위 컴포넌트는 presentational(props만). 승인된 예외 = feature `widgets/`(useQuery 결합 컴포넌트, 예: theme). `components/`는 항상 순수.
```

- [ ] **Step 3-6: 커밋 ③**

```bash
git add docs/architecture.md CLAUDE.md
git commit -m "docs(architecture): 위젯 어휘 재정의 + feature 내부 widgets/components 폴더 규약

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: 최종 검증

- [ ] **Step 4-1: 전체 검증**

Run: `npx tsc --noEmit && npx eslint src && npx jest`
Expected: 전부 통과.

- [ ] **Step 4-2: 히스토리 보존 확인**

Run: `git log --oneline -4 && git log --follow --oneline -3 -- src/features/theme/widgets/theme-widget.tsx`
Expected: 커밋 ⓪~③ 4개 + `--follow`로 구 theme-widget-list-by-code 히스토리 연결 확인.

- [ ] **Step 4-3: 시각 검증(Metro)은 Martin에게** — 렌더 불변 리팩터이므로 홈 탭 위젯 3리전 표시 확인이면 충분. push/PR은 Martin 지시 대기.
