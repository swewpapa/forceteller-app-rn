import { http } from '@/shared/lib';

export type AuthUser = { id: string }; // ⚠️ B1 확정 시 응답 형태로 확장

export type ExchangeResult = { serviceToken: string; user: AuthUser };

/** Firebase ID token을 서버 서비스 토큰으로 교환. */
export function exchangeToken(firebaseIdToken: string): Promise<ExchangeResult> {
  return http.post<ExchangeResult>('/auth/firebase', { idToken: firebaseIdToken }); // ⚠️ B1: 경로·필드명 확정 시 교체
}
