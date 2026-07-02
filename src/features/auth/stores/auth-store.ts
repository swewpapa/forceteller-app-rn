import { create } from 'zustand';
import { authTokenStore } from '@/shared/lib';
import { googleProvider } from '../providers/google-provider';
import { exchangeToken, type AuthUser } from '../api/auth-api';

type Status = 'loading' | 'guest' | 'authenticated';

type AuthState = {
  status: Status;
  user: AuthUser | null;
  restore: () => void;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  status: 'loading',
  user: null,
  restore: () => set({ status: authTokenStore.get() ? 'authenticated' : 'guest' }),
  signIn: async () => {
    console.log('[auth] signIn 시작'); // [DEBUG] 제거 예정
    const { firebaseIdToken, uid, name } = await googleProvider.signIn();
    console.log('[auth] exchangeToken 호출 (서버 교환)'); // [DEBUG] 제거 예정
    const { serviceToken, user } = await exchangeToken(firebaseIdToken, uid, name);
    console.log('[auth] serviceToken 받음:', !!serviceToken); // [DEBUG] 제거 예정
    authTokenStore.set(serviceToken);
    set({ status: 'authenticated', user });
  },
  signOut: async () => {
    await googleProvider.signOut();
    authTokenStore.clear();
    set({ status: 'guest', user: null });
  },
}));
