jest.mock('@/shared/lib', () => ({
  authTokenStore: { get: jest.fn(), set: jest.fn(), clear: jest.fn() },
  queryClient: { invalidateQueries: jest.fn() },
}));
jest.mock('../providers/google-provider', () => ({
  googleProvider: { signIn: jest.fn().mockResolvedValue({ firebaseIdToken: 'fb' }), signOut: jest.fn().mockResolvedValue(undefined) },
}));
jest.mock('../api/auth-api', () => ({
  authApi: {
    exchangeFirebaseToken: jest.fn().mockResolvedValue({ serviceToken: 'svc' }),
  },
}));

import { authTokenStore, queryClient } from '@/shared/lib';
import { useAuthStore } from '../stores/auth-store';

const mockTokenStore = authTokenStore as jest.Mocked<typeof authTokenStore>;
const mockQueryClient = queryClient as jest.Mocked<typeof queryClient>;

describe('auth-store', () => {
  beforeEach(() => {
    mockTokenStore.get.mockReset();
    mockQueryClient.invalidateQueries.mockClear();
    useAuthStore.setState({ status: 'loading' });
  });

  it('restore → guest when no token', () => {
    mockTokenStore.get.mockReturnValue(null);
    useAuthStore.getState().restore();
    expect(useAuthStore.getState().status).toBe('guest');
  });

  it('restore → authenticated when token exists', () => {
    mockTokenStore.get.mockReturnValue('svc');
    useAuthStore.getState().restore();
    expect(useAuthStore.getState().status).toBe('authenticated');
  });

  it('signIn → stores token + authenticated + invalidates all queries', async () => {
    await useAuthStore.getState().signIn();
    expect(mockTokenStore.set).toHaveBeenCalledWith('svc');
    expect(useAuthStore.getState().status).toBe('authenticated');
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalled();
  });

  it('signOut → clears + guest + invalidates all queries', async () => {
    await useAuthStore.getState().signOut();
    expect(mockTokenStore.clear).toHaveBeenCalled();
    expect(useAuthStore.getState().status).toBe('guest');
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalled();
  });
});
