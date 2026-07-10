import { create } from 'zustand';
import { authTokenStore, queryClient } from '@/shared/lib';
import { googleProvider } from '../providers/google-provider';
import { authApi } from '../api/auth-api';

type Status = 'loading' | 'guest' | 'authenticated';

type AuthState = {
  status: Status;
  restore: () => void;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  status: 'loading',
  restore: () => set({ status: authTokenStore.get() ? 'authenticated' : 'guest' }),
  signIn: async () => {
    const { firebaseIdToken, uid, name } = await googleProvider.signIn();
    const { serviceToken } = await authApi.exchangeFirebaseToken(firebaseIdToken, uid, name);
    authTokenStore.set(serviceToken);
    set({ status: 'authenticated' });
    // 로그인 직후 전 탭 서버 데이터(me/profile/today/home 등)를 재조회한다.
    queryClient.invalidateQueries();
  },
  signOut: async () => {
    await googleProvider.signOut();
    authTokenStore.clear();
    set({ status: 'guest' });
    // 로그아웃 직후 이전 사용자 캐시를 무효화 → 전 탭이 게스트 데이터로 재조회된다.
    queryClient.invalidateQueries();
  },
}));
