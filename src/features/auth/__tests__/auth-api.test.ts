import { createAuthApi } from '@/features/auth/api/auth-api';
import type { HttpClient } from '@/shared/lib';

describe('auth-api', () => {
  describe('exchangeFirebaseToken', () => {
    it('레거시 ExchangeTokenParams 형태({provider, access_token})로 요청한다', async () => {
      const post = jest
        .fn()
        .mockResolvedValue({ name: '이승환', token: 'jwt-svc', refresh_token: 'jwt-refresh' });
      const authApi = createAuthApi({ post } as unknown as HttpClient);

      await authApi.exchangeFirebaseToken('google', 'fb-id-token');

      expect(post).toHaveBeenCalledWith('/api/auth/firebase', {
        provider: 'google',
        access_token: 'fb-id-token',
      });
    });

    it('flat 응답을 {token, refreshToken}으로 정규화한다(raw 반출 금지)', async () => {
      const post = jest
        .fn()
        .mockResolvedValue({ name: '이승환', token: 'jwt-svc', refresh_token: 'jwt-refresh' });
      const authApi = createAuthApi({ post } as unknown as HttpClient);

      const result = await authApi.exchangeFirebaseToken('google', 'fb-id-token');

      expect(result).toEqual({ accessToken: 'jwt-svc', refreshToken: 'jwt-refresh' });
    });

    it('refresh_token이 없으면 refreshToken: null (방어 — refresh 플로우 없이 동작)', async () => {
      const post = jest.fn().mockResolvedValue({ token: 'jwt-svc' });
      const authApi = createAuthApi({ post } as unknown as HttpClient);

      const result = await authApi.exchangeFirebaseToken('google', 'fb-id-token');

      expect(result).toEqual({ accessToken: 'jwt-svc', refreshToken: null });
    });

    it('응답에 token이 없으면 명확한 에러를 던진다(무의미한 MMKV 크래시 방지)', async () => {
      const post = jest.fn().mockResolvedValue({ name: '이승환' }); // token 누락
      const authApi = createAuthApi({ post } as unknown as HttpClient);

      await expect(authApi.exchangeFirebaseToken('google', 'fb')).rejects.toThrow(/token/);
    });
  });

  describe('refreshToken', () => {
    it('X-Refresh-Token 헤더로 요청하고(body 없음) 응답을 정규화한다(레거시 계약)', async () => {
      const post = jest
        .fn()
        .mockResolvedValue({ token: 'jwt-new', refresh_token: 'jwt-refresh-new' });
      const authApi = createAuthApi({ post } as unknown as HttpClient);

      const result = await authApi.refreshToken('jwt-refresh-old');

      expect(post).toHaveBeenCalledWith('/api/authenticate/refresh_token', undefined, {
        headers: { 'X-Refresh-Token': 'jwt-refresh-old' },
      });
      expect(result).toEqual({ accessToken: 'jwt-new', refreshToken: 'jwt-refresh-new' });
    });

    it('응답에 token이 없으면 에러를 던진다', async () => {
      const post = jest.fn().mockResolvedValue({});
      const authApi = createAuthApi({ post } as unknown as HttpClient);

      await expect(authApi.refreshToken('jwt-refresh-old')).rejects.toThrow(/token/);
    });
  });
});
