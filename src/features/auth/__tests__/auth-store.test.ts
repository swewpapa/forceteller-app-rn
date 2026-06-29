jest.mock('@/shared/lib', () => ({
  authTokenStore: { get: jest.fn(), set: jest.fn(), clear: jest.fn() },
}));
jest.mock('../providers/google-provider', () => ({
  googleProvider: { signIn: jest.fn().mockResolvedValue({ firebaseIdToken: 'fb' }), signOut: jest.fn().mockResolvedValue(undefined) },
}));
jest.mock('../api/auth-api', () => ({
  exchangeToken: jest.fn().mockResolvedValue({ serviceToken: 'svc', user: { id: '1' } }),
}));

import { authTokenStore } from '@/shared/lib';
import { useAuthStore } from '../stores/auth-store';

const mockTokenStore = authTokenStore as jest.Mocked<typeof authTokenStore>;

describe('auth-store', () => {
  beforeEach(() => { mockTokenStore.get.mockReset(); useAuthStore.setState({ status: 'loading', user: null }); });

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

  it('signIn → stores token + authenticated', async () => {
    await useAuthStore.getState().signIn();
    expect(mockTokenStore.set).toHaveBeenCalledWith('svc');
    expect(useAuthStore.getState().status).toBe('authenticated');
  });

  it('signOut → clears + guest', async () => {
    await useAuthStore.getState().signOut();
    expect(mockTokenStore.clear).toHaveBeenCalled();
    expect(useAuthStore.getState().status).toBe('guest');
  });
});
