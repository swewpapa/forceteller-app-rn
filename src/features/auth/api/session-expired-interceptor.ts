// 배럴(@/shared/lib)은 updates(expo-updates 네이티브)를 끌고 와 테스트에서 통째 모킹이 강제된다.
// ApiError만 필요하므로 http 모듈 딥 임포트(style-engine 서브패스 임포트 선례).
import { ApiError } from '@/shared/lib/http';
import { useAuthStore } from '../stores/auth-store';

/**
 * HTTP 401 → 세션 만료 처리 응답 인터셉터(onRejected).
 * 토큰이 서버에서 만료/폐기됐는데 스토어가 authenticated로 남는 status 부패를 막는다.
 * 에러는 복구하지 않고 rethrow — 호출부(react-query 등)는 실패를 그대로 본다.
 * 등록은 App 레이어에서(기존 request 토큰 인터셉터와 동일 선례 — 순환 회피).
 */
export function createSessionExpiredInterceptor() {
  return (error: unknown): never => {
    if (error instanceof ApiError && error.kind === 'http' && error.status === 401) {
      useAuthStore.getState().expireSession();
    }
    throw error;
  };
}
