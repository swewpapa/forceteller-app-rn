import type { ThemeMode } from './resolve-theme';

/** MMKV의 부분 인터페이스 — 테스트에서 fake 주입 가능하게 DI. (splash-storage 선례) */
export type KVStore = {
  getString(key: string): string | undefined;
  set(key: string, value: string): void;
};

const KEY_MODE = 'theme.mode';
const MODES: readonly ThemeMode[] = ['system', 'day', 'night'];

function isThemeMode(value: string | undefined): value is ThemeMode {
  return value !== undefined && (MODES as readonly string[]).includes(value);
}

export function createThemeStorage(store: KVStore) {
  return {
    /** 저장값이 없거나 알 수 없는 값이면 'system'. */
    getMode(): ThemeMode {
      const raw = store.getString(KEY_MODE);
      return isThemeMode(raw) ? raw : 'system';
    },
    setMode(mode: ThemeMode): void {
      store.set(KEY_MODE, mode);
    },
  };
}

export type ThemeStorage = ReturnType<typeof createThemeStorage>;
