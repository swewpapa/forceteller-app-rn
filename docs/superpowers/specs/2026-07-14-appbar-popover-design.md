# AppBar Popover(안내 툴팁) 설계

작성일: 2026-07-14

## 목표

앱 바 액션 위에 뜨는 **비-모달 안내 툴팁**(예: 무료충전 아이콘의 "무료 포스 받기" 말풍선)을 자체 구현한다. 첫 소비는 freeforce 안내지만, 컴포넌트는 범용 `Popover`로 만들어 다른 액션(event 등)에도 재사용한다.

## 비목표

- 범용 popover 시스템(메뉴/드롭다운/다중 placement 풀세트) — 안내 툴팁 1종에 필요한 만큼만.
- 무료충전 화면·수령 로직 — Web 라우트(`/freeforce`)로 위임(기존).
- 웹의 부가 동작(진입 300ms 지연, 섹션 4회 이동 자동 소멸, `more` 탭 제외) — 1차 스코프 제외, 필요 시 후속.

## 핵심 제약: 비-모달(backdrop 없음)

툴팁이 떠 있어도 **앱 바의 다른 액션과 뒤 화면이 그대로 클릭돼야 한다.** 따라서:

- **RN `Modal` 사용 금지** — transparent여도 최상위 네이티브 뷰로 떠서 뒤 터치를 전부 가로챈다.
- 오버레이 레이어는 `pointerEvents="box-none"` — 레이어 자신은 터치를 통과시키고 **자식(말풍선·caret·✕)만** 터치를 받는다.

## 기각한 대안

- **라이브러리(react-native-popover-view 등)**: 대표 라이브러리가 방치(메인테이너 이탈, 1년+ 정체, New Arch 미확인). NativeBase deprecated, Expo UI/TipKit은 iOS 전용. RN 0.85(New Arch 강제) + 단일 용도라 자체 구현이 안전(restyle→자체 style-engine 선례와 동일 판단).
- **RN `Modal`**: 위 제약대로 backdrop 터치 캡처라 탈락.
- **앵커 버튼이 표시조건 소유**: `AppBarFreeForceButton`(shared)이 로그인 상태(`useAuthStore`, features)를 알아야 하는데 eslint `shared↛features` 금지로 불가.

## 아키텍처

`ScreenContainer`가 children 위에 오버레이 host를 얹고 Context로 등록 창구를 연다. 앵커는 제자리(AppBar)에 두고, 툴팁은 host 트리에 렌더돼 상위의 overflow/z에 걸리지 않는다.

```tsx
// ScreenContainer (수정)
<View style={container}>
  <PopoverProvider>
    {children}
    <PopoverHost />   {/* StyleSheet.absoluteFill, pointerEvents="box-none" */}
  </PopoverProvider>
</View>
```

- **PopoverProvider / Context**: 현재 활성 popover 항목(`{ id, rect, message, placement, onDismiss }`)을 등록/해제. 단일 활성으로 시작(동시 1개).
- **PopoverHost**: `box-none` 오버레이. 등록된 항목의 `rect` 기준으로 말풍선 + caret + ✕ 렌더.
- **Popover(공개 API)**: 앵커를 `children`으로 받아 감싸고 measure → `visible`이면 Context에 등록.

## 공개 API

```ts
export type PopoverPlacement = 'bottom-end' | 'bottom-start' | 'bottom';

export type PopoverProps = {
  /** dismiss 영구 저장 키(예: 'freeforce'). ✕ 시 MMKV에 기록. */
  id: string;
  /** 표시 여부. 소비처(도메인 훅)가 조건을 계산해 넘긴다. */
  visible: boolean;
  /** 말풍선 텍스트. */
  message: string;
  /** 앵커 기준 정렬. 기본 'bottom-end'. */
  placement?: PopoverPlacement;
  /** ✕ 또는 프로그램 dismiss 콜백(옵션). */
  onDismiss?: () => void;
  /** 앵커 — 제자리 렌더 + measure 대상. */
  children: ReactElement;
};
```

소비 예(AppBar `trailing` 조합):

```tsx
const showTip = useFreeForceTip(); // features/freeforce
...
<Popover id="freeforce" visible={showTip} message="무료 포스 받기">
  <AppBarFreeForceButton onPress={() => navigation.navigate('Web', { path: '/freeforce' })} />
</Popover>
```

## 앵커 measure

`Popover`는 `<View collapsable={false} ref={anchorRef}>{children}</View>`로 앵커를 감싸고(안드로이드 measure 보장), `visible` 전환 시 `anchorRef.measureInWindow((x, y, w, h) => …)`로 화면 좌표를 얻어 Context에 등록한다. 앱 바는 고정 위치라 1회 measure로 충분(스크롤 추적 불필요).

## 위치 계산 (PopoverHost)

- `bottom-end`: 말풍선 `top = rect.y + rect.h + GAP`, 우측을 `rect.x + rect.w`에 맞춤.
- **경계 클램프**: 말풍선 left가 화면 좌우 패딩(예: 8) 밖으로 나가지 않게 clamp.
- **caret**: 앵커 중심 x(`rect.x + rect.w/2`)를 가리키도록 말풍선 상단에 회전 사각형(View) 배치, 말풍선 내 상대 위치 계산.

## dismiss (영구, MMKV)

- 전용 MMKV 인스턴스 `createMMKV({ id: 'popover' })`, 키 `popover.dismissed.{id}`.
- ✕ 탭 → `set(key, true)` + `onDismiss?.()`. 재실행해도 유지.
- **리액티브 반영**: `react-native-mmkv`의 `useMMKVBoolean(key)`로 dismiss 상태를 구독해, ✕ 즉시 표시조건이 false로 재계산되도록 한다. (검증 필요: mmkv 4.x의 리액티브 훅 API)

## 표시 조건 — `features/freeforce`

```
shared/components/popover/  ← 범용(Popover/Host/Context/dismiss)
features/freeforce/
  hooks/useFreeForceTip.ts
  index.ts
```

```ts
// useFreeForceTip: config(lottie) + 로그인 + !dismissed
export function useFreeForceTip(): boolean {
  const status = useAuthStore((s) => s.status);
  const cfg = remoteConfig.getJSON<{ appBarButtonType?: string }>('free_force_config', {});
  const dismissed = usePopoverDismissed('freeforce'); // MMKV 리액티브
  return cfg.appBarButtonType === 'lottie' && status === 'authenticated' && !dismissed;
}
```

- `remoteConfig`(shared/config)와 `useAuthStore`(features/auth, cross-consumable) 소비 — features 레이어라 둘 다 접근 가능.
- 소비처(home/today/premium 탭)는 `useFreeForceTip()` + `<Popover>`만 조합 → 표시조건 중복 제거.

## 파일 구조

| 파일 | 책임 |
|---|---|
| `shared/components/popover/popover-context.ts` | `PopoverProvider` + 등록/해제 훅 |
| `shared/components/popover/popover-host.tsx` | box-none 오버레이 + 말풍선/caret/✕ 렌더 + 위치 계산 |
| `shared/components/popover/popover.tsx` | 공개 `Popover`(앵커 래핑 + measure + 등록) |
| `shared/components/popover/popover-dismiss.ts` | MMKV `popover` + `usePopoverDismissed`/`dismissPopover` |
| `shared/components/screen-container.tsx` (수정) | `PopoverProvider` + `PopoverHost` 감싸기 |
| `features/freeforce/hooks/useFreeForceTip.ts` (+`index.ts`) | 표시조건 훅 |
| 소비: home/today/premium 탭 | `useFreeForceTip` + `<Popover>` 조합 |

## 사이드이펙트

- **ScreenContainer**: 모든 화면이 쓰는 셸에 Provider+Host 추가 → 전 화면 영향. Host는 box-none이라 popover 없으면 무해(렌더 없음). 회귀 확인 대상.
- **배럴**: `shared/components`에 `Popover` 노출. `AppBarFreeForceButton`은 무변경(Popover가 감쌈).
- **MMKV 인스턴스 추가**(`popover`) — auth/theme/config/splash에 이은 5번째.

## 테스트

- `popover-dismiss`: set/get/키 포맷 단위 테스트(KVStore DI, config-storage 선례).
- `useFreeForceTip`: config/로그인/dismissed 조합별 boolean(모킹).
- Popover/Host 위치 계산(clamp): 순수 함수로 분리해 테스트(measure는 모킹).
- 시각(말풍선/caret/backdrop 통과)은 시뮬레이터 수동 QA.

## 진행

`feature/appbar-trailing-slot`(AppBar trailing 슬롯, PR #27)에 의존 — 그 위(또는 머지 후 main)에서 popover 브랜치. push 없음, 커밋은 명시 요청 시.
