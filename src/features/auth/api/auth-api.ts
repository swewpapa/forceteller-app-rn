import { http, type HttpClient } from '@/shared/lib';

/**
 * 인증 토큰 엔드포인트들의 실제 응답(레거시 forceteller-app flat 형태 — 신규 API의
 * {status,data} 봉투가 아님). raw 응답 타입은 api/ 밖으로 반출하지 않는다(normalize 경계).
 */
interface AuthTokenResponse {
  /** 서비스 토큰(JWT). 이후 요청의 X-Auth-Token 헤더에 실린다. */
  token: string;
  refresh_token?: string | null;
  name?: string | null;
}

/** 정규화된 인증 토큰 쌍(도메인 타입). raw `token`/snake_case 등 API 어휘는 이 경계에서 흡수한다. */
export interface AuthTokenPair {
  accessToken: string;
  /** 서버가 내려주지 않으면 null — refresh 플로우 없이 access만으로 동작(방어). */
  refreshToken: string | null;
}

function normalizeAuthTokenPair(raw: AuthTokenResponse | null | undefined): AuthTokenPair {
  // 응답 형태 불일치로 빈 토큰이 저장 경계까지 흘러가지 않도록 여기서 막는다.
  if (!raw?.token) {
    throw new Error('토큰 응답에 token이 없습니다');
  }

  return { accessToken: raw.token, refreshToken: raw.refresh_token ?? null };
}

export function createAuthApi(client: HttpClient) {
  return {
    /**
     * Firebase ID token을 서버 서비스 토큰으로 교환.
     * POST /api/auth/firebase — body는 레거시 ExchangeTokenParams와 동일한
     * `{ provider, access_token }` (로그인 사용자 정보는 useMe로 조회).
     */
    exchangeFirebaseToken: async (provider: string, idToken: string): Promise<AuthTokenPair> => {
      const raw = await client.post<AuthTokenResponse>('/api/auth/firebase', {
        provider,
        access_token: idToken,
      });

      return normalizeAuthTokenPair(raw);
    },

    /**
     * refresh 토큰으로 서비스 토큰 갱신. 레거시 계약: 토큰은 body가 아니라
     * X-Refresh-Token 헤더로 전달한다.
     */
    refreshToken: async (refreshToken: string): Promise<AuthTokenPair> => {
      const raw = await client.post<AuthTokenResponse>(
        '/api/authenticate/refresh_token',
        undefined,
        {
          headers: { 'X-Refresh-Token': refreshToken },
        },
      );

      return normalizeAuthTokenPair(raw);
    },
  };
}

export const authApi = createAuthApi(http);
