import type { KVStorage } from '@/shared/types';
import type { ThemeMode } from './resolve-theme';

const KEY_MODE = 'theme.mode';
const MODES: readonly ThemeMode[] = ['system', 'day', 'night'];

function isThemeMode(value: string | undefined): value is ThemeMode {
  return value !== undefined && (MODES as readonly string[]).includes(value);
}

export function createThemeStorage(kv: KVStorage) {
  return {
    /** 저장값이 없거나 알 수 없는 값이면 'system'. */
    getMode(): ThemeMode {
      const raw = kv.getString(KEY_MODE);
      return isThemeMode(raw) ? raw : 'system';
    },
    setMode(mode: ThemeMode): void {
      kv.set(KEY_MODE, mode);
    },
  };
}

export type ThemeStorage = ReturnType<typeof createThemeStorage>;
