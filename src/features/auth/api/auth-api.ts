import { http, type HttpClient } from '@/shared/lib';

export type ExchangeResult = { serviceToken: string };

export function createAuthApi(client: HttpClient) {
  return {
    /**
     * Firebase ID token + 사용자 정보를 서버 서비스 토큰으로 교환.
     * POST /api/auth/firebase (body: { provider, id, name, access_token })
     * — 레거시 forceteller-app 형식.
     * ⚠️ B1: 실제 응답 형태는 네이티브 QA에서 확정. 서버가 user를 함께 주더라도
     * 로그인 사용자 정보는 useMe로 조회하므로 도메인은 serviceToken만 사용한다(user는 무시).
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
