import type { RequestConfig } from '@/shared/lib/http';
import type { AuthStorage } from '../stores/auth-storage';

/** 토큰을 실을 요청 헤더명(레거시 ApiHeaderInterceptor와 동일 계약). */
export const AUTH_HEADER = 'X-Auth-Token';

/**
 * 토큰이 있으면 요청 헤더에 주입하는 request 인터셉터(DI 팩토리).
 * 등록은 App 레이어에서 — shared(http)가 features(auth)를 모르게 유지
 * (session-expired-interceptor와 동일 선례).
 */
export function createAuthTokenInterceptor(storage: AuthStorage) {
  return (config: RequestConfig): RequestConfig => {
    const token = storage.getAccessToken();
    if (token) config.headers[AUTH_HEADER] = token;
    return config;
  };
}
