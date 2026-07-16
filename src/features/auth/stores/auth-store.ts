import { create } from 'zustand';
import { queryClient } from '@/shared/lib';
import { googleProvider } from '@/features/auth/providers/google-provider';
import { authApi } from '@/features/auth/api/auth-api';
import { authStorage } from './auth-storage';

export type AuthStatus = 'loading' | 'guest' | 'authenticated';
type Status = AuthStatus;

type AuthState = {
  status: Status;
  restore: () => void;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  /** 401(토큰 만료) 시 로컬 세션 정리. signOut과 달리 구글 원격 로그아웃은 하지 않는다. */
  expireSession: () => void;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'loading',
  restore: () => set({ status: authStorage.get() ? 'authenticated' : 'guest' }),
  signIn: async () => {
    const { firebaseIdToken, uid, name } = await googleProvider.signIn();
    const { serviceToken } = await authApi.exchangeFirebaseToken(firebaseIdToken, uid, name);
    authStorage.set(serviceToken);
    set({ status: 'authenticated' });
    // 로그인 직후 전 탭 서버 데이터(me/profile/today/home 등)를 재조회한다.
    queryClient.invalidateQueries();
  },
  signOut: async () => {
    await googleProvider.signOut();
    authStorage.clear();
    set({ status: 'guest' });
    // 로그아웃 직후 이전 사용자 캐시를 무효화 → 전 탭이 게스트 데이터로 재조회된다.
    queryClient.invalidateQueries();
  },
  expireSession: () => {
    // 동시 다발 401(여러 쿼리가 함께 실패) dedupe: 이미 authenticated가 아니면 무시.
    if (get().status !== 'authenticated') return;
    authStorage.clear();
    set({ status: 'guest' });
    // 만료된 사용자 캐시 무효화. 토큰-gated 쿼리(useMe 등)는 disabled로 꺼지고
    // 게스트 쿼리는 재조회된다(재조회는 401을 내지 않으므로 루프 없음).
    queryClient.invalidateQueries();
  },
}));
