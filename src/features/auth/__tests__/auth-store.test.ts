jest.mock('@/shared/lib', () => ({
  queryClient: { invalidateQueries: jest.fn() },
}));
// 상태를 가진 fake — restore의 "정리 후 재판정(read-after-clear)" 흐름을 자연스럽게 검증한다.
jest.mock('@/features/auth/stores/auth-storage', () => {
  let token: string | null = null;
  let refresh: string | null = null;
  let provider: string | null = null;
  return {
    authStorage: {
      getAccessToken: jest.fn(() => token),
      getRefreshToken: jest.fn(() => refresh),
      getProvider: jest.fn(() => provider),
      setTokenPair: jest.fn((pair: { accessToken: string; refreshToken: string | null }) => {
        token = pair.accessToken;
        refresh = pair.refreshToken;
      }),
      setSession: jest.fn(
        (session: { accessToken: string; refreshToken: string | null; provider: string }) => {
          token = session.accessToken;
          refresh = session.refreshToken;
          provider = session.provider;
        },
      ),
      clear: jest.fn(() => {
        token = null;
        refresh = null;
        provider = null;
      }),
      /** 테스트 전용 시드 — 저장소 초기 상태를 주입한다. */
      __seed: (t: string | null, r: string | null, p: string | null = null) => {
        token = t;
        refresh = r;
        provider = p;
      },
    },
  };
});
jest.mock('@/features/auth/providers/google-provider', () => ({
  googleProvider: {
    signIn: jest.fn().mockResolvedValue({ idToken: 'fb', uid: 'uid-1', name: null }),
    signOut: jest.fn().mockResolvedValue(undefined),
  },
}));
jest.mock('@/features/auth/api/auth-api', () => ({
  authApi: {
    exchangeFirebaseToken: jest.fn(),
    refreshToken: jest.fn(),
  },
}));

import { queryClient } from '@/shared/lib';
import { ApiError } from '@/shared/lib/http';
import { authStorage } from '@/features/auth/stores/auth-storage';
import { googleProvider } from '@/features/auth/providers/google-provider';
import { authApi } from '@/features/auth/api/auth-api';
import { useAuthStore } from '@/features/auth/stores/auth-store';

const mockStorage = authStorage as jest.Mocked<typeof authStorage> & {
  __seed: (t: string | null, r: string | null, p?: string | null) => void;
};
const mockProvider = googleProvider as jest.Mocked<typeof googleProvider>;
const mockApi = authApi as jest.Mocked<typeof authApi>;
const mockQueryClient = queryClient as jest.Mocked<typeof queryClient>;

/**
 * needsRefresh(순수)는 모킹하지 않고 실코드로 검증 — Date.now를 고정 시각으로 모킹하고
 * Node로 사전 생성한 고정 JWT 벡터를 쓴다(jwt.test.ts와 동일 벡터, Buffer 타입 의존 회피).
 */
const NOW_MS = 1_700_000_000_000;
// { exp: NOW+1h, iat: NOW-1h } — 만료 전 + 발급 24h 이내 → 갱신 불필요
const FRESH_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjE3MDAwMDM2MDAsImlhdCI6MTY5OTk5NjQwMH0.sig';
// { exp: NOW+1h, iat: NOW-25h } — 미만료 + 발급 24h 경과(stale) → 낙관 진입 + 백그라운드 갱신
const STALE_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjE3MDAwMDM2MDAsImlhdCI6MTY5OTkxMDAwMH0.sig';
// { exp: NOW-1, iat: NOW-1h } — 만료(expired) → 갱신 완료까지 블로킹
const EXPIRED_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjE2OTk5OTk5OTksImlhdCI6MTY5OTk5NjQwMH0.sig';

describe('auth-store', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, 'now').mockReturnValue(NOW_MS);
    mockStorage.__seed(null, null, null);
    useAuthStore.setState({ status: 'loading' });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('restore (하이브리드: 만료만 블로킹, 유효하면 즉시 진입)', () => {
    it('토큰 없음 → guest, 갱신 시도 없음', async () => {
      await useAuthStore.getState().restore();
      expect(useAuthStore.getState().status).toBe('guest');
      expect(mockApi.refreshToken).not.toHaveBeenCalled();
    });

    it('신선한 토큰 → 갱신 API를 호출하지 않고 authenticated', async () => {
      mockStorage.__seed(FRESH_TOKEN, 'ref', 'google');
      await useAuthStore.getState().restore();
      expect(mockApi.refreshToken).not.toHaveBeenCalled();
      expect(useAuthStore.getState().status).toBe('authenticated');
    });

    describe('stale 토큰(미만료 + 24h 경과) — 낙관 경로', () => {
      it('갱신 완료를 기다리지 않고 즉시 authenticated', () => {
        mockStorage.__seed(STALE_TOKEN, 'ref', 'google');
        mockApi.refreshToken.mockReturnValue(new Promise(() => {})); // 영원히 pending
        useAuthStore.getState().restore();
        expect(useAuthStore.getState().status).toBe('authenticated');
      });

      it('백그라운드 refresh 성공 시 새 토큰 쌍을 영속한다', async () => {
        mockStorage.__seed(STALE_TOKEN, 'ref-old', 'google');
        mockApi.refreshToken.mockResolvedValue({ accessToken: 'acc-new', refreshToken: 'ref-new' });

        await useAuthStore.getState().restore();

        expect(mockApi.refreshToken).toHaveBeenCalledWith('ref-old');
        expect(mockStorage.setTokenPair).toHaveBeenCalledWith({
          accessToken: 'acc-new',
          refreshToken: 'ref-new',
        });
        expect(useAuthStore.getState().status).toBe('authenticated');
      });

      it('백그라운드 refresh가 4xx로 거부되면 세션 만료 처리(authenticated → guest 반전)', async () => {
        mockStorage.__seed(STALE_TOKEN, 'ref-rejected', 'google');
        mockApi.refreshToken.mockRejectedValue(new ApiError('http', 403, null));

        const restored = useAuthStore.getState().restore();
        expect(useAuthStore.getState().status).toBe('authenticated'); // 낙관 진입
        await restored;

        expect(mockStorage.clear).toHaveBeenCalled();
        expect(useAuthStore.getState().status).toBe('guest');
      });

      it('refresh 토큰이 없으면 세션 유지 + 갱신 스킵(토큰이 아직 유효하므로 로그아웃 과함)', async () => {
        mockStorage.__seed(STALE_TOKEN, null, 'google');
        await useAuthStore.getState().restore();
        expect(mockApi.refreshToken).not.toHaveBeenCalled();
        expect(mockStorage.clear).not.toHaveBeenCalled();
        expect(useAuthStore.getState().status).toBe('authenticated');
      });

      it('sync 진행 중 세션이 교체됐으면 4xx여도 새 세션을 지우지 않는다(stale-response 가드)', async () => {
        mockStorage.__seed(STALE_TOKEN, 'ref-A', 'google');
        let rejectRefresh!: (reason: unknown) => void;
        mockApi.refreshToken.mockReturnValue(
          new Promise((_, reject) => {
            rejectRefresh = reject;
          }),
        );

        const restored = useAuthStore.getState().restore();
        // sync가 떠 있는 동안 사용자가 로그아웃→재로그인을 완주해 세션이 교체된 상황
        mockStorage.__seed('acc-B', 'ref-B', 'google');
        rejectRefresh(new ApiError('http', 403, null));
        await restored;

        expect(mockStorage.clear).not.toHaveBeenCalled();
        expect(useAuthStore.getState().status).toBe('authenticated');
      });

      it('백그라운드 refresh가 네트워크 에러/5xx면 세션을 유지한다', async () => {
        mockStorage.__seed(STALE_TOKEN, 'ref', 'google');
        mockApi.refreshToken.mockRejectedValueOnce(new ApiError('network', null, null));
        await useAuthStore.getState().restore();
        expect(useAuthStore.getState().status).toBe('authenticated');

        useAuthStore.setState({ status: 'loading' });
        mockApi.refreshToken.mockRejectedValueOnce(new ApiError('http', 500, null));
        await useAuthStore.getState().restore();
        expect(mockStorage.clear).not.toHaveBeenCalled();
        expect(useAuthStore.getState().status).toBe('authenticated');
      });
    });

    describe('만료(expired) 토큰 — 블로킹 경로', () => {
      it('갱신이 끝날 때까지 loading을 유지하고, 성공하면 authenticated', async () => {
        mockStorage.__seed(EXPIRED_TOKEN, 'ref-old', 'google');
        let resolveRefresh!: (tokens: { accessToken: string; refreshToken: string | null }) => void;
        mockApi.refreshToken.mockReturnValue(
          new Promise((resolve) => {
            resolveRefresh = resolve;
          }),
        );

        const restored = useAuthStore.getState().restore();
        expect(useAuthStore.getState().status).toBe('loading'); // 확정 전 진입하지 않음

        resolveRefresh({ accessToken: 'acc-new', refreshToken: 'ref-new' });
        await restored;

        expect(mockStorage.setTokenPair).toHaveBeenCalledWith({
          accessToken: 'acc-new',
          refreshToken: 'ref-new',
        });
        expect(useAuthStore.getState().status).toBe('authenticated');
      });

      it('refresh가 4xx로 거부되면 guest로 확정(반전 플래시 없음)', async () => {
        mockStorage.__seed(EXPIRED_TOKEN, 'ref-rejected', 'google');
        mockApi.refreshToken.mockRejectedValue(new ApiError('http', 403, null));

        await useAuthStore.getState().restore();

        expect(mockStorage.clear).toHaveBeenCalled();
        expect(useAuthStore.getState().status).toBe('guest');
      });

      it('refresh 토큰이 없으면 세션 정리 → guest(죽은 세션 + 갱신 수단 없음)', async () => {
        mockStorage.__seed(EXPIRED_TOKEN, null, 'google');
        await useAuthStore.getState().restore();
        expect(mockApi.refreshToken).not.toHaveBeenCalled();
        expect(mockStorage.clear).toHaveBeenCalled();
        expect(useAuthStore.getState().status).toBe('guest');
      });

      it('refresh가 네트워크 에러면 세션을 유지한다(오프라인 부팅 보호 — 401 폴백에 위임)', async () => {
        mockStorage.__seed(EXPIRED_TOKEN, 'ref', 'google');
        mockApi.refreshToken.mockRejectedValue(new ApiError('network', null, null));

        await useAuthStore.getState().restore();

        expect(mockStorage.clear).not.toHaveBeenCalled();
        expect(useAuthStore.getState().status).toBe('authenticated');
      });
    });
  });

  describe('signIn(provider)', () => {
    it("signIn('google') → 프로바이더 인증 → exchange → 세션(토큰+수단) 영속 → authenticated → 전 쿼리 무효화", async () => {
      mockApi.exchangeFirebaseToken.mockResolvedValue({ accessToken: 'svc', refreshToken: 'ref' });

      await useAuthStore.getState().signIn('google');

      expect(mockProvider.signIn).toHaveBeenCalled();
      expect(mockApi.exchangeFirebaseToken).toHaveBeenCalledWith('google', 'fb');
      expect(mockStorage.setSession).toHaveBeenCalledWith({
        accessToken: 'svc',
        refreshToken: 'ref',
        provider: 'google',
      });
      expect(useAuthStore.getState().status).toBe('authenticated');
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalled();
    });

    it('프로바이더 인증 실패(취소 등) 시 세션을 만들지 않고 에러를 전파한다', async () => {
      mockProvider.signIn.mockRejectedValueOnce(new Error('cancelled'));

      await expect(useAuthStore.getState().signIn('google')).rejects.toThrow('cancelled');

      expect(mockStorage.setSession).not.toHaveBeenCalled();
      expect(useAuthStore.getState().status).toBe('loading'); // 진입 전 상태 유지
    });

    it('서버 교환 실패 시 세션을 만들지 않고 에러를 전파한다(구글 인증은 성공한 경우)', async () => {
      mockApi.exchangeFirebaseToken.mockRejectedValueOnce(new ApiError('http', 500, null));

      await expect(useAuthStore.getState().signIn('google')).rejects.toThrow();

      expect(mockStorage.setSession).not.toHaveBeenCalled();
      expect(mockQueryClient.invalidateQueries).not.toHaveBeenCalled();
      expect(useAuthStore.getState().status).toBe('loading'); // 진입 전 상태 유지
    });
  });

  describe('signOut', () => {
    it('저장된 수단의 원격 로그아웃 + 로컬 정리 + guest + 전 쿼리 무효화', async () => {
      mockStorage.__seed('acc', 'ref', 'google');
      useAuthStore.setState({ status: 'authenticated' });

      await useAuthStore.getState().signOut();

      expect(mockProvider.signOut).toHaveBeenCalled();
      expect(mockStorage.clear).toHaveBeenCalled();
      expect(useAuthStore.getState().status).toBe('guest');
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalled();
    });

    it('원격 로그아웃이 실패해도 로컬 세션은 정리된다(로그아웃 감금 방지 — 합의 정책)', async () => {
      mockStorage.__seed('acc', 'ref', 'google');
      useAuthStore.setState({ status: 'authenticated' });
      mockProvider.signOut.mockRejectedValueOnce(new Error('network down'));

      await useAuthStore.getState().signOut();

      expect(mockStorage.clear).toHaveBeenCalled();
      expect(useAuthStore.getState().status).toBe('guest');
    });

    it('저장된 수단이 없으면(부재/미등록) 원격 호출 없이 로컬만 정리한다', async () => {
      mockStorage.__seed('acc', 'ref', null);
      await useAuthStore.getState().signOut();
      expect(mockProvider.signOut).not.toHaveBeenCalled();
      expect(useAuthStore.getState().status).toBe('guest');

      mockStorage.__seed('acc', 'ref', 'kakao'); // 미등록 id(구버전/손상 값 방어)
      await useAuthStore.getState().signOut();
      expect(mockProvider.signOut).not.toHaveBeenCalled();
      expect(mockStorage.clear).toHaveBeenCalled();
    });
  });

  describe('expireSession', () => {
    it('authenticated → 로컬만 정리 + guest + 전 쿼리 무효화 (원격 로그아웃 없음)', () => {
      useAuthStore.setState({ status: 'authenticated' });
      useAuthStore.getState().expireSession();
      expect(mockProvider.signOut).not.toHaveBeenCalled();
      expect(mockStorage.clear).toHaveBeenCalled();
      expect(useAuthStore.getState().status).toBe('guest');
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalled();
    });

    it('guest/loading → noop (동시 401 dedupe)', () => {
      useAuthStore.setState({ status: 'guest' });
      useAuthStore.getState().expireSession();
      useAuthStore.setState({ status: 'loading' });
      useAuthStore.getState().expireSession();
      expect(mockStorage.clear).not.toHaveBeenCalled();
      expect(mockQueryClient.invalidateQueries).not.toHaveBeenCalled();
      expect(useAuthStore.getState().status).toBe('loading');
    });
  });
});
