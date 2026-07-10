import { createAuthApi } from '../api/auth-api';
import type { HttpClient } from '@/shared/lib';

describe('auth-api', () => {
  it('flat { token } 응답에서 serviceToken을 뽑는다', async () => {
    // 실제 /api/auth/firebase 응답 형태(레거시 flat): { name, token, refresh_token }
    const post = jest
      .fn()
      .mockResolvedValue({ name: '이승환', token: 'jwt-svc', refresh_token: 'jwt-refresh' });
    const authApi = createAuthApi({ post } as unknown as HttpClient);

    const result = await authApi.exchangeFirebaseToken('fb-id-token', 'uid-1', 'Tester');

    expect(result).toEqual({ serviceToken: 'jwt-svc' });
    expect(post).toHaveBeenCalledWith('/api/auth/firebase', {
      provider: 'google',
      id: 'uid-1',
      name: 'Tester',
      access_token: 'fb-id-token',
    });
  });

  it('응답에 token이 없으면 명확한 에러를 던진다(무의미한 MMKV 크래시 방지)', async () => {
    const post = jest.fn().mockResolvedValue({ name: '이승환' }); // token 누락
    const authApi = createAuthApi({ post } as unknown as HttpClient);

    await expect(authApi.exchangeFirebaseToken('fb', 'uid', 'n')).rejects.toThrow(/token/);
  });
});
