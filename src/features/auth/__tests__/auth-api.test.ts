jest.mock('@/shared/lib', () => ({ http: { post: jest.fn() } }));
import { http } from '@/shared/lib';
import { exchangeToken } from '../api/auth-api';

describe('auth-api', () => {
  it('exchanges firebase id token for service token', async () => {
    (http.post as jest.Mock).mockResolvedValue({ serviceToken: 'svc', user: { id: '1' } });
    const result = await exchangeToken('fb-id-token');
    expect(result).toEqual({ serviceToken: 'svc', user: { id: '1' } });
    expect(http.post).toHaveBeenCalledWith('/auth/firebase', { idToken: 'fb-id-token' }); // ⚠️ B1
  });
});
