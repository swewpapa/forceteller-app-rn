import { createMMKV, useMMKVBoolean } from 'react-native-mmkv';

type BoolKV = { getBoolean(k: string): boolean | undefined; set(k: string, v: boolean): void };

const key = (id: string) => `popover.dismissed.${id}`;

export function createPopoverDismissStore(store: BoolKV) {
  return {
    isDismissed: (id: string): boolean => store.getBoolean(key(id)) ?? false,
    dismiss: (id: string): void => store.set(key(id), true),
  };
}

const mmkv = createMMKV({ id: 'popover' });

/** 앱 공통 popover dismiss 저장소(MMKV, 영구). */
export const popoverDismiss = createPopoverDismissStore(mmkv);

/**
 * dismiss 상태 리액티브 구독 — ✕ 탭 시 즉시 리렌더.
 * `useMMKVBoolean(key, instance)`는 react-native-mmkv 4.x 공식 export이며
 * 두 번째 인자로 MMKV 인스턴스를 받는다(타입 정의로 확인).
 */
export function usePopoverDismissed(id: string): boolean {
  const [dismissed] = useMMKVBoolean(key(id), mmkv);
  return dismissed ?? false;
}

export const dismissPopover = (id: string) => popoverDismiss.dismiss(id);
