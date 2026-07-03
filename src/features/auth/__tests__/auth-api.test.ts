jest.mock('@/shared/lib', () => ({ http: { post: jest.fn() } }));
import { http } from '@/shared/lib';
import { exchangeToken } from '../api/auth-api';

describe('auth-api', () => {
  it('exchanges firebase id token for service token', async () => {
    (http.post as jest.Mock).mockResolvedValue({ serviceToken: 'svc', user: { id: '1' } });
    const result = await exchangeToken('fb-id-token', 'uid-1', 'Tester');
    expect(result).toEqual({ serviceToken: 'svc', user: { id: '1' } });
    expect(http.post).toHaveBeenCalledWith('/api/auth/firebase', {
      provider: 'google',
      id: 'uid-1',
      name: 'Tester',
      access_token: 'fb-id-token',
    }); // ⚠️ B1: 응답 형태는 서버 확인 후 확정
  });
});
