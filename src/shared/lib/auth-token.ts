import { createMMKV } from 'react-native-mmkv';
import { env } from '@/shared/config';
import type { RequestConfig } from './http';

/** 토큰을 실을 요청 헤더명. TODO: 서버 계약 확인 후 수정. */
export const AUTH_HEADER = 'X-Auth-Token';

const KEY = 'auth.accessToken';

/** auth-token 저장소가 의존하는 최소 KV 인터페이스(DI로 테스트 가능). MMKV와 메서드 호환. */
export type KVStore = {
  getString(key: string): string | undefined;
  set(key: string, value: string): void;
  remove(key: string): void;
};

/** 액세스 토큰 저장소. */
export function createAuthTokenStore(store: KVStore) {
  return {
    get: (): string | null => store.getString(KEY) ?? null,
    set: (token: string): void => store.set(KEY, token),
    clear: (): void => store.remove(KEY),
  };
}

export type AuthTokenStore = ReturnType<typeof createAuthTokenStore>;

/** 토큰이 있으면 요청 헤더에 주입하는 request 인터셉터(DI 팩토리). */
export function createAuthRequestInterceptor(store: AuthTokenStore) {
  return (config: RequestConfig): RequestConfig => {
    const token = store.get();
    if (token) config.headers[AUTH_HEADER] = token;
    return config;
  };
}

/** 앱 공통 토큰 저장소(MMKV, 암호화). 로그인 시 set, 로그아웃 시 clear. */
export const authTokenStore = createAuthTokenStore(
  createMMKV({ id: 'auth', encryptionKey: env.mmkvEncryptionKey }),
);
