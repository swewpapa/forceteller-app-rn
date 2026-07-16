import type { KVStorage } from '@/shared/types';
import type { RemoteConfig } from './remote-config';

/** provider별 config를 JSON 문자열로 MMKV에 캐시. */
export function createConfigStorage(kv: KVStorage) {
  return {
    read(provider: string): RemoteConfig | null {
      const raw = kv.getString(`config.${provider}`);
      if (!raw) return null;
      try {
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? (parsed as RemoteConfig) : null;
      } catch {
        return null;
      }
    },
    write(provider: string, config: RemoteConfig): void {
      kv.set(`config.${provider}`, JSON.stringify(config));
    },
  };
}

export type ConfigStorage = ReturnType<typeof createConfigStorage>;
