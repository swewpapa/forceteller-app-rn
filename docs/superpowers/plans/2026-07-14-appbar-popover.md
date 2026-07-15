# AppBar Popover 구현 플랜

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 앱 바 액션 위 비-모달 안내 툴팁(`Popover`) + freeforce 첫 소비를 구현한다.

**Architecture:** ScreenContainer가 `PopoverProvider`+`PopoverHost`(box-none 오버레이)를 감싼다. `Popover`가 앵커를 children으로 감싸 measure→Context 등록, Host가 rect 기준 말풍선+caret 렌더. dismiss는 MMKV 영구. 표시조건은 `features/freeforce`의 `useFreeForceTip`.

**Tech Stack:** RN 0.85(New Arch), react-native-mmkv, zustand(auth), remote-config(shared/config), jest.

**Spec:** `docs/superpowers/specs/2026-07-14-appbar-popover-design.md`

**핵심 제약:** RN `Modal` 금지(backdrop 터치 캡처). 오버레이는 `pointerEvents="box-none"`.

---

## File Structure

| 파일 | 책임 |
|---|---|
| `src/shared/components/popover/popover-dismiss.ts` (신규) | MMKV `popover` + `usePopoverDismissed(id)`/`dismissPopover(id)` |
| `src/shared/components/popover/popover-position.ts` (신규) | 위치 계산 순수 함수(bottom-end + 경계 클램프 + caret offset) |
| `src/shared/components/popover/popover-context.tsx` (신규) | `PopoverProvider` + `usePopoverRegistry`(등록/해제) + `usePopoverEntry`(Host 구독) |
| `src/shared/components/popover/popover-host.tsx` (신규) | box-none 오버레이 + 위치 계산 소비 + 말풍선/caret/✕ 렌더 |
| `src/shared/components/popover/popover.tsx` (신규) | 공개 `Popover`(앵커 래핑 + measureInWindow + 등록) |
| `src/shared/components/screen-container.tsx` (수정) | `PopoverProvider` + `PopoverHost` 감싸기 |
| `src/shared/components/index.ts` (수정) | `Popover` 배럴 노출 |
| `src/features/freeforce/hooks/useFreeForceTip.ts` (신규) + `index.ts` | 표시조건 훅 |
| `src/features/home|today|premium` 탭 (수정) | freeforce 버튼을 `<Popover>`로 감쌈 |

테스트: `popover-dismiss`(DI), `popover-position`(순수), `useFreeForceTip`(모킹).

---

## Task 0: 브랜치 + 문서 커밋

**Files:** 문서 2건(스펙·플랜)

- [ ] **Step 1: 브랜치 생성** — base = `feature/appbar-trailing-slot`(PR #27 의존). PR #27 머지 후면 main 리베이스.

```bash
git checkout feature/appbar-trailing-slot
git checkout -b feature/appbar-popover
```

- [ ] **Step 2: 스펙+플랜 커밋**

```bash
git add docs/superpowers/specs/2026-07-14-appbar-popover-design.md docs/superpowers/plans/2026-07-14-appbar-popover.md
git commit -m "docs(popover): AppBar Popover 설계·구현 플랜"
```

---

## Task 1: popover-dismiss (MMKV 영구 dismiss)

**Files:**
- Create: `src/shared/components/popover/popover-dismiss.ts`
- Test: `src/shared/components/popover/__tests__/popover-dismiss.test.ts`

- [ ] **Step 1: 실패 테스트** — KVStore DI로 순수 로직 검증(auth-token/config-storage 선례).

```ts
import { createPopoverDismissStore } from '../popover-dismiss';

const fake = () => {
  const m = new Map<string, boolean>();
  return {
    store: { getBoolean: (k: string) => m.get(k), set: (k: string, v: boolean) => void m.set(k, v) },
    m,
  };
};

describe('popover dismiss store', () => {
  it('기본 미dismiss', () => {
    const { store } = fake();
    expect(createPopoverDismissStore(store).isDismissed('freeforce')).toBe(false);
  });
  it('dismiss 후 true + 키 포맷', () => {
    const { store, m } = fake();
    const s = createPopoverDismissStore(store);
    s.dismiss('freeforce');
    expect(s.isDismissed('freeforce')).toBe(true);
    expect(m.has('popover.dismissed.freeforce')).toBe(true);
  });
});
```

- [ ] **Step 2: 실패 확인** — `pnpm exec jest popover-dismiss` → FAIL(모듈 없음)
- [ ] **Step 3: 구현**

```ts
import { createMMKV } from 'react-native-mmkv';
import { useMMKVBoolean } from 'react-native-mmkv';

type BoolKV = { getBoolean(k: string): boolean | undefined; set(k: string, v: boolean): void };

const key = (id: string) => `popover.dismissed.${id}`;

export function createPopoverDismissStore(store: BoolKV) {
  return {
    isDismissed: (id: string): boolean => store.getBoolean(key(id)) ?? false,
    dismiss: (id: string): void => store.set(key(id), true),
  };
}

const mmkv = createMMKV({ id: 'popover' });
export const popoverDismiss = createPopoverDismissStore(mmkv);

/** 리액티브 구독 — ✕ 즉시 반영. useMMKVBoolean이 mmkv 4.x에서 동작하는지 이 태스크에서 검증;
 *  안 되면 useState + 이벤트로 폴백. */
export function usePopoverDismissed(id: string): boolean {
  const [dismissed] = useMMKVBoolean(key(id), mmkv);
  return dismissed ?? false;
}
export const dismissPopover = (id: string) => popoverDismiss.dismiss(id);
```

- [ ] **Step 4: 통과 확인** — `pnpm exec jest popover-dismiss` → PASS. `useMMKVBoolean` import가 tsc 통과하는지 확인(실패 시 폴백 구현 + 주석).
- [ ] **Step 5: 커밋** — `git commit -m "feat(popover): 영구 dismiss 저장(MMKV)"`

---

## Task 2: popover-position (위치 계산 순수 함수)

**Files:**
- Create: `src/shared/components/popover/popover-position.ts`
- Test: `src/shared/components/popover/__tests__/popover-position.test.ts`

- [ ] **Step 1: 실패 테스트**

```ts
import { computePopover } from '../popover-position';

const anchor = { x: 300, y: 50, width: 44, height: 44 };
const opts = { screenWidth: 375, bubbleWidth: 160, gap: 4, edgePadding: 8 };

describe('computePopover (bottom-end)', () => {
  it('앵커 아래 + 우측 정렬', () => {
    const r = computePopover(anchor, { ...opts, placement: 'bottom-end' });
    expect(r.top).toBe(50 + 44 + 4);
    expect(r.left).toBe(300 + 44 - 160); // right = anchor right
  });
  it('좌측 넘침 clamp', () => {
    const r = computePopover({ x: 10, y: 50, width: 44, height: 44 }, { ...opts, placement: 'bottom-end' });
    expect(r.left).toBe(8); // edgePadding
  });
  it('caret은 앵커 중심을 말풍선 내 상대 x로', () => {
    const r = computePopover(anchor, { ...opts, placement: 'bottom-end' });
    expect(r.caretLeft).toBe(300 + 22 - r.left); // anchorCenterX - bubbleLeft
  });
});
```

- [ ] **Step 2: 실패 확인** → FAIL
- [ ] **Step 3: 구현**

```ts
export type AnchorRect = { x: number; y: number; width: number; height: number };
export type PopoverPlacement = 'bottom-end' | 'bottom-start' | 'bottom';
export type ComputeOpts = {
  placement: PopoverPlacement;
  screenWidth: number;
  bubbleWidth: number;
  gap: number;
  edgePadding: number;
};
export type PopoverLayout = { top: number; left: number; caretLeft: number };

export function computePopover(a: AnchorRect, o: ComputeOpts): PopoverLayout {
  const top = a.y + a.height + o.gap;
  const rawLeft =
    o.placement === 'bottom-end'
      ? a.x + a.width - o.bubbleWidth
      : o.placement === 'bottom-start'
        ? a.x
        : a.x + a.width / 2 - o.bubbleWidth / 2;
  const maxLeft = o.screenWidth - o.edgePadding - o.bubbleWidth;
  const left = Math.max(o.edgePadding, Math.min(rawLeft, maxLeft));
  const anchorCenterX = a.x + a.width / 2;
  const caretLeft = anchorCenterX - left;
  return { top, left, caretLeft };
}
```

- [ ] **Step 4: 통과 확인** → PASS
- [ ] **Step 5: 커밋** — `git commit -m "feat(popover): 위치 계산 순수 함수(clamp+caret)"`

---

## Task 3: popover-context

**Files:** Create `src/shared/components/popover/popover-context.tsx`

- [ ] **Step 1: 구현** — 단일 활성 popover 등록/해제 + Host 구독. (렌더 로직 없어 순수 UI, 유닛테스트 생략 — Host 통합에서 검증)

```tsx
import { createContext, useCallback, useContext, useMemo, useState, type PropsWithChildren } from 'react';
import type { AnchorRect, PopoverPlacement } from './popover-position';

export type PopoverEntry = {
  id: string;
  rect: AnchorRect;
  message: string;
  placement: PopoverPlacement;
  onDismiss?: () => void;
};

type Registry = {
  entry: PopoverEntry | null;
  register: (e: PopoverEntry) => void;
  unregister: (id: string) => void;
};

const Ctx = createContext<Registry | null>(null);

export function PopoverProvider({ children }: PropsWithChildren) {
  const [entry, setEntry] = useState<PopoverEntry | null>(null);
  const register = useCallback((e: PopoverEntry) => setEntry(e), []);
  const unregister = useCallback((id: string) => setEntry((p) => (p?.id === id ? null : p)), []);
  const value = useMemo(() => ({ entry, register, unregister }), [entry, register, unregister]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePopoverRegistry(): Registry {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('Popover must be used within PopoverProvider (ScreenContainer)');
  return ctx;
}
```

- [ ] **Step 2: tsc 통과 확인** — `pnpm typecheck`
- [ ] **Step 3: 커밋** — `git commit -m "feat(popover): Provider + 등록 Context"`

---

## Task 4: popover-host

**Files:** Create `src/shared/components/popover/popover-host.tsx`

- [ ] **Step 1: 구현** — 등록 entry가 있으면 box-none 오버레이에 말풍선+caret+✕. `computePopover`로 위치. 색은 primary 배경 + on-primary 텍스트(Figma). bubbleWidth는 측정 없이 고정폭(예: 콘텐츠 기반 근사) 또는 onLayout 측정 후 위치 확정.

```tsx
import { useState } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions, type LayoutChangeEvent } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faXmark } from '@fortawesome/pro-light-svg-icons/faXmark';
import { Typography } from '@/shared/components/typography';
import { useAppColors } from '@/shared/theme';
import { usePopoverRegistry } from './popover-context';
import { computePopover } from './popover-position';

const GAP = 4;
const EDGE = 8;

export function PopoverHost() {
  const { entry, unregister } = usePopoverRegistry();
  const colors = useAppColors();
  const { width: screenWidth } = useWindowDimensions();
  const [bubbleWidth, setBubbleWidth] = useState(0);

  if (!entry) return null;

  const onLayout = (e: LayoutChangeEvent) => setBubbleWidth(e.nativeEvent.layout.width);
  const layout =
    bubbleWidth > 0
      ? computePopover(entry.rect, {
          placement: entry.placement,
          screenWidth,
          bubbleWidth,
          gap: GAP,
          edgePadding: EDGE,
        })
      : null;

  const handleDismiss = () => {
    entry.onDismiss?.();
    unregister(entry.id);
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <View
        onLayout={onLayout}
        style={[
          styles.bubble,
          { backgroundColor: colors.background.primary },
          layout ? { top: layout.top, left: layout.left, opacity: 1 } : styles.measuring,
        ]}
      >
        <View
          style={[
            styles.caret,
            { backgroundColor: colors.background.primary },
            layout ? { left: Math.max(8, layout.caretLeft - 4) } : null,
          ]}
          pointerEvents="none"
        />
        <Typography variant="label-md" color="onPrimary">
          {entry.message}
        </Typography>
        <Pressable onPress={handleDismiss} hitSlop={8} accessibilityLabel="닫기">
          <FontAwesomeIcon icon={faXmark} size={14} color={colors.text.onPrimary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
  },
  measuring: { top: -9999, left: 0, opacity: 0 },
  caret: {
    position: 'absolute',
    top: -4,
    width: 8,
    height: 8,
    transform: [{ rotate: '45deg' }],
  },
});
```

> 색 토큰(`background.primary`, `text.onPrimary`, `label-md`)이 실제 존재하는지 구현 중 확인 — 없으면 근접 토큰으로 대체하고 주석. Figma는 primary(#191919 계열) 배경 + 흰 글씨 12px.

- [ ] **Step 2: tsc 통과** — `pnpm typecheck`
- [ ] **Step 3: 커밋** — `git commit -m "feat(popover): box-none Host(말풍선+caret+dismiss)"`

---

## Task 5: popover (공개 API) + 배럴

**Files:** Create `src/shared/components/popover/popover.tsx`; Modify `src/shared/components/index.ts`

- [ ] **Step 1: 구현** — 앵커 래핑 + measureInWindow + visible 시 등록/해제.

```tsx
import { cloneElement, useEffect, useRef, type ReactElement } from 'react';
import { View } from 'react-native';
import { usePopoverRegistry } from './popover-context';
import { dismissPopover } from './popover-dismiss';
import type { PopoverPlacement } from './popover-position';

export type PopoverProps = {
  id: string;
  visible: boolean;
  message: string;
  placement?: PopoverPlacement;
  onDismiss?: () => void;
  children: ReactElement;
};

export function Popover({ id, visible, message, placement = 'bottom-end', onDismiss, children }: PopoverProps) {
  const anchorRef = useRef<View>(null);
  const { register, unregister } = usePopoverRegistry();

  useEffect(() => {
    if (!visible) {
      unregister(id);
      return;
    }
    const node = anchorRef.current;
    if (!node) return;
    node.measureInWindow((x, y, width, height) => {
      register({
        id,
        rect: { x, y, width, height },
        message,
        placement,
        onDismiss: () => {
          dismissPopover(id); // 영구 저장 → usePopoverDismissed 구독이 visible=false로
          onDismiss?.();
        },
      });
    });
    return () => unregister(id);
  }, [visible, id, message, placement, onDismiss, register, unregister]);

  return (
    <View ref={anchorRef} collapsable={false}>
      {children}
    </View>
  );
}
```

- [ ] **Step 2: 배럴** — `index.ts` 미디어/표시 적절 그룹에 `export { Popover, type PopoverProps } from './popover/popover';`
- [ ] **Step 3: tsc 통과** — `pnpm typecheck`
- [ ] **Step 4: 커밋** — `git commit -m "feat(popover): Popover 공개 API(앵커 래핑+measure) + 배럴"`

---

## Task 6: ScreenContainer 통합

**Files:** Modify `src/shared/components/screen-container.tsx`

- [ ] **Step 1: 구현** — Provider + Host 감쌈.

```tsx
return (
  <View style={[styles.container, { paddingTop: insets.top }]}>
    <PopoverProvider>
      {children}
      <PopoverHost />
    </PopoverProvider>
  </View>
);
```
(import `PopoverProvider` from `./popover/popover-context`, `PopoverHost` from `./popover/popover-host`)

- [ ] **Step 2: tsc/lint/jest 통과 확인** — 전 화면 셸 변경이라 회귀 확인.
- [ ] **Step 3: 커밋** — `git commit -m "feat(popover): ScreenContainer에 Provider+Host 통합"`

---

## Task 7: useFreeForceTip (features/freeforce)

**Files:**
- Create: `src/features/freeforce/hooks/useFreeForceTip.ts`, `src/features/freeforce/index.ts`
- Test: `src/features/freeforce/__tests__/useFreeForceTip.test.ts`

- [ ] **Step 1: 실패 테스트** — remoteConfig/useAuthStore/usePopoverDismissed 모킹, 조합별 boolean.

```ts
// 모킹: remoteConfig.getJSON, useAuthStore status, usePopoverDismissed
// (config lottie & authenticated & !dismissed) → true; 하나라도 어긋나면 false
```

- [ ] **Step 2: 실패 확인** → FAIL
- [ ] **Step 3: 구현**

```ts
import { remoteConfig } from '@/shared/config';
import { useAuthStore } from '@/features/auth';
import { usePopoverDismissed } from '@/shared/components/popover/popover-dismiss';

export function useFreeForceTip(): boolean {
  const status = useAuthStore((s) => s.status);
  const dismissed = usePopoverDismissed('freeforce');
  const cfg = remoteConfig.getJSON<{ appBarButtonType?: string }>('free_force_config', {});
  return cfg.appBarButtonType === 'lottie' && status === 'authenticated' && !dismissed;
}
```
`index.ts`: `export { useFreeForceTip } from './hooks/useFreeForceTip';`

- [ ] **Step 4: 통과 확인** → PASS. eslint 레이어(features→shared, features→auth cross-consumable) 확인.
- [ ] **Step 5: 커밋** — `git commit -m "feat(freeforce): 앱바 툴팁 표시조건 훅"`

---

## Task 8: 탭 소비 (freeforce 버튼 Popover 래핑)

**Files:** Modify home/today/premium 탭(freeforce 버튼 사용처)

- [ ] **Step 1: 각 탭에서 `AppBarFreeForceButton`을 `Popover`로 감쌈**

```tsx
const showTip = useFreeForceTip();
// trailing 안에서:
<Popover id="freeforce" visible={showTip} message="무료 포스 받기">
  <AppBarFreeForceButton onPress={() => navigation.navigate('Web', { path: '/freeforce' })} />
</Popover>
```
today는 `appBarTrailing` 변수 안에서 래핑(5회 재사용 유지).

- [ ] **Step 2: tsc/lint 통과**
- [ ] **Step 3: 커밋** — `git commit -m "feat(popover): 탭 앱바 freeforce 안내 툴팁 연결"`

---

## Task 9: 최종 검증

- [ ] **Step 1:** `pnpm typecheck && pnpm lint && pnpm format:check && pnpm exec jest` 전부 그린
- [ ] **Step 2:** 시각 QA(Martin) — 말풍선 위치/caret, ✕ 후 재실행에도 안 뜸, **backdrop 없이 앱바 다른 액션·뒤 화면 클릭됨**, iconColor(투데이 오버레이) 무관하게 정상. Metro `--reset-cache`.
- [ ] **Step 3:** 최종 통합 리뷰 → finishing-a-development-branch

---

## Self-Review

- **스펙 커버리지**: 비-모달(box-none, Task 4·6) / 렌더(Provider+Host, Task 3·6) / API(children 래핑+measure, Task 5) / 위치(clamp+caret, Task 2·4) / dismiss(MMKV 영구, Task 1) / 표시조건(useFreeForceTip, Task 7) / 소비(Task 8) — 모두 커버.
- **타입 일관**: `PopoverEntry.rect: AnchorRect`(position), `PopoverProps.placement: PopoverPlacement`(position), `computePopover` 시그니처가 Host 호출과 일치.
- **리스크**: ① `useMMKVBoolean`(mmkv 4.x) 동작 — Task 1에서 검증, 실패 시 useState+이벤트 폴백. ② `background.primary`/`text.onPrimary`/`Typography color="onPrimary"` 토큰 존재 — Task 4에서 확인, 없으면 근접 대체. ③ measureInWindow 타이밍(첫 렌더 후) — visible 전환 useEffect라 OK.
