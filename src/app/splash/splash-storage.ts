import type { SplashMeta } from './splash-types';

/** MMKV의 부분 인터페이스 — 테스트에서 fake 주입 가능하게 DI. */
export type KVStore = {
  getString(key: string): string | undefined;
  set(key: string, value: string): void;
};

const KEY_URL = 'splash.appliedUrl';
const KEY_ID = 'splash.appliedId';

export function createSplashStorage(store: KVStore) {
  return {
    read(): SplashMeta | null {
      const appliedUrl = store.getString(KEY_URL);
      const appliedId = store.getString(KEY_ID);
      if (!appliedUrl || !appliedId) return null;
      return { appliedUrl, appliedId };
    },
    write(meta: SplashMeta): void {
      store.set(KEY_URL, meta.appliedUrl);
      store.set(KEY_ID, meta.appliedId);
    },
  };
}

export type SplashStorage = ReturnType<typeof createSplashStorage>;
