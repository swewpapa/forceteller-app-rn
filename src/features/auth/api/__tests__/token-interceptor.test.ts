import { createTokenInterceptor, AUTH_HEADER } from '@/features/auth/api/token-interceptor';
import { createAuthStorage } from '@/features/auth/stores/auth-storage';
import type { RequestConfig } from '@/shared/lib/http';
import type { KVStorage } from '@/shared/types';

function fakeKV(): KVStorage {
  const m = new Map<string, string>();
  return {
    getString: (k) => m.get(k),
    set: (k, v) => {
      m.set(k, v);
    },
    remove: (k) => {
      m.delete(k);
    },
  };
}

describe('createTokenInterceptor', () => {
  const baseConfig = (): RequestConfig => ({
    url: 'https://api.test/x',
    method: 'GET',
    headers: {},
  });

  it('토큰이 있으면 헤더에 주입한다', () => {
    const storage = createAuthStorage(fakeKV());
    storage.set('tok');
    const interceptor = createTokenInterceptor(storage);
    expect(interceptor(baseConfig()).headers[AUTH_HEADER]).toBe('tok');
  });

  it('토큰이 없으면 헤더를 추가하지 않는다', () => {
    const storage = createAuthStorage(fakeKV());
    const interceptor = createTokenInterceptor(storage);
    expect(interceptor(baseConfig()).headers[AUTH_HEADER]).toBeUndefined();
  });
});
