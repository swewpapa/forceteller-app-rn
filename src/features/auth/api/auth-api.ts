import { http, type HttpClient } from '@/shared/lib';

export type AuthUser = { id: string }; // ⚠️ B1 확정 시 응답 형태로 확장

export type ExchangeResult = { serviceToken: string; user: AuthUser };

export function createAuthApi(client: HttpClient) {
  return {
    /**
     * Firebase ID token + 사용자 정보를 서버 서비스 토큰으로 교환.
     * POST /api/auth/firebase (body: { provider, id, name, access_token })
     * — 레거시 forceteller-app 형식. ⚠️ B1: 응답 형태(serviceToken/user)는 서버 실제 응답 확인 후 확정
     */
    exchangeFirebaseToken: (
      firebaseIdToken: string,
      uid: string,
      name: string | null,
    ): Promise<ExchangeResult> =>
      client.post<ExchangeResult>('/api/auth/firebase', {
        provider: 'google',
        id: uid,
        name,
        access_token: firebaseIdToken,
      }),
  };
}

export const authApi = createAuthApi(http);
