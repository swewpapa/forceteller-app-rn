import { create } from 'zustand';
import { queryClient } from '@/shared/lib';
// 배럴(@/shared/lib)의 ApiError 재수출 대신 딥 임포트 — session-expired-interceptor 선례.
import { ApiError } from '@/shared/lib/http';
import { getAuthProvider, type AuthProviderId } from '../providers/provider-registry';
import { authApi } from '../api/auth-api';
import { isExpired, needsRefresh } from '../lib/jwt';
import { authStorage } from './auth-storage';

export type AuthStatus = 'loading' | 'guest' | 'authenticated';

type AuthState = {
  status: AuthStatus;
  /**
   * 부팅 복원(하이브리드) — "기다릴 가치가 있을 때만 기다린다":
   * - 토큰이 아직 유효하면(신선/stale) 즉시 authenticated로 진입하고, 24h 경과분
   *   신선화는 백그라운드로 갱신한다. 매일 첫 부팅이 지연되지 않는다.
   * - 이미 만료된 토큰이면 갱신 완료까지 'loading' 유지(블로킹) — 낙관 진입해봤자
   *   첫 요청 401 반전이 확정이라 기다리는 게 낫다.
   * 반환 promise는 복원(백그라운드 갱신 포함) 완료 신호 — 부팅 경로(App)는 대기하지
   * 않고, 테스트가 대기에 사용한다.
   */
  restore: () => Promise<void>;
  /** 선택한 수단으로 로그인. 수단별 SDK 차이는 AuthProvider 구현에 갇힌다. */
  signIn: (provider: AuthProviderId) => Promise<void>;
  /** 로그인 시 저장된 수단의 원격 로그아웃 + 로컬 세션 정리. 원격 실패는 로컬 정리를 막지 않는다. */
  signOut: () => Promise<void>;
  /** 401(토큰 만료) 시 로컬 세션 정리. signOut과 달리 프로바이더 원격 로그아웃은 하지 않는다. */
  expireSession: () => void;
};

/**
 * 저장된 세션을 서버와 동기화(sync* 규약 — 실패를 던지지 않고 결과는 저장소 상태로 관찰):
 * 갱신 성공 → 새 토큰 쌍 영속, HTTP 4xx(서버가 세션을 부정) → 세션 파기(clear),
 * 네트워크/타임아웃/5xx → 보존(오프라인 부팅을 로그아웃시키지 않는다 — 진짜 만료라면
 * 이후 요청의 401 → expireSession 폴백이 처리).
 */
async function syncSession(refreshToken: string): Promise<void> {
  try {
    authStorage.setTokenPair(await authApi.refreshToken(refreshToken));
  } catch (reason) {
    const rejectedByServer =
      reason instanceof ApiError &&
      reason.kind === 'http' &&
      reason.status !== null &&
      reason.status >= 400 &&
      reason.status < 500;

    // compare-and-clear: sync가 떠 있는 동안 세션이 교체됐다면(로그아웃→재로그인 완주)
    // 늦게 도착한 옛 토큰의 거부 응답이 새 세션을 지우면 안 된다 — 내가 갱신하려던
    // 그 refresh 토큰이 아직 저장소에 있을 때만 정리한다.
    if (rejectedByServer && authStorage.getRefreshToken() === refreshToken) {
      authStorage.clear();
    }
  }
}

export const useAuthStore = create<AuthState>((setState, getState) => ({
  status: 'loading',
  restore: async () => {
    const accessToken = authStorage.getAccessToken();
    const now = Date.now();

    if (!accessToken) {
      setState({ status: 'guest' });
      return;
    }

    if (isExpired(accessToken, now)) {
      // 죽은 세션 — 갱신 완료까지 블로킹. 갱신 수단(refresh 토큰)이 없으면 정리.
      const refreshToken = authStorage.getRefreshToken();
      if (refreshToken) {
        await syncSession(refreshToken);
      } else {
        authStorage.clear();
      }
      // 갱신/정리 결과가 반영된 저장소 기준으로 최종 판정
      setState({ status: authStorage.getAccessToken() ? 'authenticated' : 'guest' });
      return;
    }

    // 아직 유효한 세션 — 즉시 진입(낙관)
    setState({ status: 'authenticated' });

    // 24h 경과분 신선화는 백그라운드로. refresh 토큰이 없으면 스킵 —
    // 토큰이 유효한데 갱신 수단이 없다는 이유로 로그아웃시키지 않는다.
    if (needsRefresh(accessToken, now)) {
      const refreshToken = authStorage.getRefreshToken();
      if (refreshToken) {
        await syncSession(refreshToken);
        // 백그라운드 갱신이 서버 거부로 세션을 정리했다면 화면도 만료 처리
        if (!authStorage.getAccessToken()) getState().expireSession();
      }
    }
  },
  signIn: async (providerId) => {
    const provider = getAuthProvider(providerId);
    if (!provider) {
      // AuthProviderId 유니온이라 정상 경로에선 도달 불가 — 런타임 방어
      throw new Error(`등록되지 않은 로그인 수단입니다: ${providerId}`);
    }

    const { idToken } = await provider.signIn();
    const tokens = await authApi.exchangeFirebaseToken(providerId, idToken);
    authStorage.setSession({ ...tokens, provider: providerId });
    setState({ status: 'authenticated' });
    // 로그인 직후 전 탭 서버 데이터(me/profile/today/home 등)를 재조회한다.
    queryClient.invalidateQueries();
  },
  signOut: async () => {
    // 세션이 어느 수단으로 열렸는지는 저장소가 기억한다(부팅 복원 세션 포함).
    const providerId = authStorage.getProvider();
    const provider = providerId ? getAuthProvider(providerId) : null;

    if (provider) {
      try {
        await provider.signOut();
      } catch {
        // 원격 로그아웃 실패(네트워크 등)가 로컬 로그아웃을 막으면 사용자가 로그아웃에
        // 갇힌다 → 무시하고 로컬 세션은 반드시 정리한다.
      }
    }

    authStorage.clear();
    setState({ status: 'guest' });
    // 로그아웃 직후 이전 사용자 캐시를 무효화 → 전 탭이 게스트 데이터로 재조회된다.
    queryClient.invalidateQueries();
  },
  expireSession: () => {
    // 동시 다발 401(여러 쿼리가 함께 실패) dedupe: 이미 authenticated가 아니면 무시.
    if (getState().status !== 'authenticated') return;
    authStorage.clear();
    setState({ status: 'guest' });
    // 만료된 사용자 캐시 무효화. 토큰-gated 쿼리(useMe 등)는 disabled로 꺼지고
    // 게스트 쿼리는 재조회된다(재조회는 401을 내지 않으므로 루프 없음).
    queryClient.invalidateQueries();
  },
}));
