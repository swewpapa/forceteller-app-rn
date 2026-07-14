import type { RemoteConfig } from './remote-config';

/** MMKV의 부분 인터페이스 — 테스트에서 fake 주입 가능하게 DI(splash-storage 동형). */
export type KVStore = {
  getString(key: string): string | undefined;
  set(key: string, value: string): void;
};

/** provider별 config를 JSON 문자열로 MMKV에 캐시. */
export function createConfigStorage(store: KVStore) {
  return {
    read(provider: string): RemoteConfig | null {
      const raw = store.getString(`config.${provider}`);
      if (!raw) return null;
      try {
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? (parsed as RemoteConfig) : null;
      } catch {
        return null;
      }
    },
    write(provider: string, config: RemoteConfig): void {
      store.set(`config.${provider}`, JSON.stringify(config));
    },
  };
}

export type ConfigStorage = ReturnType<typeof createConfigStorage>;
