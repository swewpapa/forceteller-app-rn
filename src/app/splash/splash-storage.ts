import type { KVStorage } from '@/shared/types';
import type { SplashMeta } from './splash-types';

const KEY_URL = 'splash.appliedUrl';
const KEY_ID = 'splash.appliedId';

export function createSplashStorage(kv: KVStorage) {
  return {
    read(): SplashMeta | null {
      const appliedUrl = kv.getString(KEY_URL);
      const appliedId = kv.getString(KEY_ID);
      if (!appliedUrl || !appliedId) return null;
      return { appliedUrl, appliedId };
    },
    write(meta: SplashMeta): void {
      kv.set(KEY_URL, meta.appliedUrl);
      kv.set(KEY_ID, meta.appliedId);
    },
  };
}

export type SplashStorage = ReturnType<typeof createSplashStorage>;
