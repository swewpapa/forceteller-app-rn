import { useEffect } from 'react';
import { createMMKV } from 'react-native-mmkv';
import { http } from '@/shared/lib';
import { createConfigStorage } from './config-storage';
import { normalizeConfig, remoteConfig, type ConfigResponse, type RemoteConfig } from './remote-config';

// MMKV side-effect 격리: 이 모듈은 배럴(@/shared/config)에 노출하지 않고 App만 직접 import한다.
const DEFAULT_PROVIDER = 'firebase';
const storage = createConfigStorage(createMMKV({ id: 'config' }));

/** GET /api/config/{provider} → normalize. 실패 시 null(캐시 유지, 부팅 비차단). */
async function fetchConfig(provider: string): Promise<RemoteConfig | null> {
  try {
    const res = await http.get<ConfigResponse>(`/api/config/${provider}`);
    return normalizeConfig(res.data);
  } catch {
    return null;
  }
}

/** 부팅 시 캐시에서 동기 하이드레이트(렌더 전 호출 — App 모듈 로드). */
export function initRemoteConfig(provider: string = DEFAULT_PROVIDER): void {
  remoteConfig.apply(storage.read(provider) ?? {});
}

/** App에 마운트: 백그라운드 갱신(SWR) → 성공 시 스냅샷 apply + MMKV write. */
export function useRemoteConfigSync(provider: string = DEFAULT_PROVIDER): void {
  useEffect(() => {
    let cancelled = false;
    fetchConfig(provider).then((config) => {
      if (config && !cancelled) {
        remoteConfig.apply(config);
        storage.write(provider, config);
      }
    });
    return () => {
      cancelled = true;
    };
    // 마운트 1회만(deps는 모듈 싱글턴).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
