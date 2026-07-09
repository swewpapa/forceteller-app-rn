import { createAuthApi } from '../api/auth-api';
import type { HttpClient } from '@/shared/lib';

describe('auth-api', () => {
  it('exchanges firebase id token for service token', async () => {
    const post = jest.fn().mockResolvedValue({ serviceToken: 'svc' });
    const authApi = createAuthApi({ post } as unknown as HttpClient);

    const result = await authApi.exchangeFirebaseToken('fb-id-token', 'uid-1', 'Tester');

    expect(result).toEqual({ serviceToken: 'svc' });
    expect(post).toHaveBeenCalledWith('/api/auth/firebase', {
      provider: 'google',
      id: 'uid-1',
      name: 'Tester',
      access_token: 'fb-id-token',
    }); // ⚠️ B1: 응답 형태는 서버 확인 후 확정
  });
});
