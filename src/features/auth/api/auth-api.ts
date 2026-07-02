import { http } from '@/shared/lib';

export type AuthUser = { id: string }; // ⚠️ B1 확정 시 응답 형태로 확장

export type ExchangeResult = { serviceToken: string; user: AuthUser };

/**
 * Firebase ID token + 사용자 정보를 서버 서비스 토큰으로 교환.
 * 레거시 forceteller-app 의 POST /api/auth/firebase 형식을 따른다.
 * (body: { provider, id, name, access_token })
 */
export function exchangeToken(
  firebaseIdToken: string,
  idToken: string,
  name: string | null,
): Promise<ExchangeResult> {
  return http.post<ExchangeResult>('/api/auth/firebase', {
    provider: 'google',
    idToken,
    name,
    access_token: firebaseIdToken,
  }); // ⚠️ B1: 응답 형태(serviceToken/user)는 서버 실제 응답 확인 후 확정
}
