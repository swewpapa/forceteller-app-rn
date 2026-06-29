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
    const { firebaseIdToken } = await googleProvider.signIn();
    const { serviceToken, user } = await exchangeToken(firebaseIdToken);
    authTokenStore.set(serviceToken);
    set({ status: 'authenticated', user });
  },
  signOut: async () => {
    await googleProvider.signOut();
    authTokenStore.clear();
    set({ status: 'guest', user: null });
  },
}));
