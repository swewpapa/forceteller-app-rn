import { http, type HttpClient } from '@/shared/lib';

export type ExchangeResult = { serviceToken: string };

/**
 * /api/auth/firebase 실제 응답(레거시 forceteller-app flat 형태 — 신규 API의 {status,data} 봉투가 아님).
 * raw 응답 타입은 api/ 밖으로 반출하지 않는다(normalize 경계).
 */
type FirebaseExchangeResponse = {
  /** 서비스 토큰(JWT). 이후 요청의 X-Auth-Token 헤더에 실린다. */
  token: string;
  /** 향후 토큰 갱신 플로우용(현재 도메인 미사용). */
  refresh_token?: string;
  name?: string | null;
};

export function createAuthApi(client: HttpClient) {
  return {
    /**
     * Firebase ID token + 사용자 정보를 서버 서비스 토큰으로 교환.
     * POST /api/auth/firebase (body: { provider, id, name, access_token }) — 레거시 forceteller-app 형식.
     * 응답(B1 확정): flat `{ token, refresh_token, name }`. 서비스 토큰은 `token`만 도메인에서 사용한다
     * (로그인 사용자 정보는 useMe로 조회하므로 name은 무시).
     */
    exchangeFirebaseToken: async (
      firebaseIdToken: string,
      uid: string,
      name: string | null,
    ): Promise<ExchangeResult> => {
      const raw = await client.post<FirebaseExchangeResponse>('/api/auth/firebase', {
        provider: 'google',
        id: uid,
        name,
        access_token: firebaseIdToken,
      });
      if (!raw?.token) {
        throw new Error('Firebase 토큰 교환 응답에 token이 없습니다');
      }
      return { serviceToken: raw.token };
    },
  };
}

export const authApi = createAuthApi(http);
