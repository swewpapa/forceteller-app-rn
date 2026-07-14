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

/** App 부팅 이펙트에서 호출(fire-and-forget): 백그라운드 갱신(SWR) → 성공 시 스냅샷 apply + MMKV write.
 *  실패(null)면 캐시 스냅샷 유지. 훅이 아닌 일반 함수 — 반영 대상이 React state가 아니라
 *  모듈 싱글턴/MMKV라 언마운트 가드(cancelled)가 불필요하고, App useEffect에서 restore()와 나란히 호출한다. */
export function syncRemoteConfig(provider: string = DEFAULT_PROVIDER): void {
  fetchConfig(provider).then((config) => {
    if (config) {
      remoteConfig.apply(config);
      storage.write(provider, config);
    }
  });
}
