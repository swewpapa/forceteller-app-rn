jest.mock('@/shared/lib', () => ({
  queryClient: { invalidateQueries: jest.fn() },
}));
jest.mock('@/features/auth/stores/auth-storage', () => ({
  authStorage: { get: jest.fn(), set: jest.fn(), clear: jest.fn() },
}));
jest.mock('@/features/auth/providers/google-provider', () => ({
  googleProvider: {
    signIn: jest.fn().mockResolvedValue({ firebaseIdToken: 'fb' }),
    signOut: jest.fn().mockResolvedValue(undefined),
  },
}));
jest.mock('@/features/auth/api/auth-api', () => ({
  authApi: {
    exchangeFirebaseToken: jest.fn().mockResolvedValue({ serviceToken: 'svc' }),
  },
}));

import { queryClient } from '@/shared/lib';
import { authStorage } from '@/features/auth/stores/auth-storage';
import { useAuthStore } from '@/features/auth/stores/auth-store';

const mockStorage = authStorage as jest.Mocked<typeof authStorage>;
const mockQueryClient = queryClient as jest.Mocked<typeof queryClient>;

describe('auth-store', () => {
  beforeEach(() => {
    mockStorage.get.mockReset();
    mockQueryClient.invalidateQueries.mockClear();
    useAuthStore.setState({ status: 'loading' });
  });

  it('restore → guest when no token', () => {
    mockStorage.get.mockReturnValue(null);
    useAuthStore.getState().restore();
    expect(useAuthStore.getState().status).toBe('guest');
  });

  it('restore → authenticated when token exists', () => {
    mockStorage.get.mockReturnValue('svc');
    useAuthStore.getState().restore();
    expect(useAuthStore.getState().status).toBe('authenticated');
  });

  it('signIn → stores token + authenticated + invalidates all queries', async () => {
    await useAuthStore.getState().signIn();
    expect(mockStorage.set).toHaveBeenCalledWith('svc');
    expect(useAuthStore.getState().status).toBe('authenticated');
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalled();
  });

  it('signOut → clears + guest + invalidates all queries', async () => {
    await useAuthStore.getState().signOut();
    expect(mockStorage.clear).toHaveBeenCalled();
    expect(useAuthStore.getState().status).toBe('guest');
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalled();
  });

  it('expireSession(authenticated) → clears + guest + invalidates (로컬 세션만, 구글 signOut 없음)', () => {
    useAuthStore.setState({ status: 'authenticated' });
    mockStorage.clear.mockClear();
    useAuthStore.getState().expireSession();
    expect(mockStorage.clear).toHaveBeenCalled();
    expect(useAuthStore.getState().status).toBe('guest');
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalled();
  });

  it('expireSession(guest/loading) → noop (동시 401 dedupe)', () => {
    useAuthStore.setState({ status: 'guest' });
    mockStorage.clear.mockClear();
    mockQueryClient.invalidateQueries.mockClear();
    useAuthStore.getState().expireSession();
    useAuthStore.setState({ status: 'loading' });
    useAuthStore.getState().expireSession();
    expect(mockStorage.clear).not.toHaveBeenCalled();
    expect(mockQueryClient.invalidateQueries).not.toHaveBeenCalled();
    expect(useAuthStore.getState().status).toBe('loading');
  });
});
