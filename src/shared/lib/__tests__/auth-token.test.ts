import {
  createAuthTokenStore,
  createAuthRequestInterceptor,
  AUTH_HEADER,
} from '@/shared/lib/auth-token';
import type { RequestConfig } from '@/shared/lib/http';

function mockStore() {
  const m = new Map<string, string>();
  return {
    getString: (k: string) => m.get(k),
    set: (k: string, v: string) => m.set(k, v),
    remove: (k: string) => m.delete(k),
  };
}

describe('authTokenStore', () => {
  it('초기에는 null을 반환한다', () => {
    expect(createAuthTokenStore(mockStore()).get()).toBeNull();
  });

  it('set 후 get으로 토큰을 읽는다', () => {
    const store = createAuthTokenStore(mockStore());
    store.set('tok');
    expect(store.get()).toBe('tok');
  });

  it('clear 후에는 null을 반환한다', () => {
    const store = createAuthTokenStore(mockStore());
    store.set('tok');
    store.clear();
    expect(store.get()).toBeNull();
  });
});

describe('createAuthRequestInterceptor', () => {
  const baseConfig = (): RequestConfig => ({
    url: 'https://api.test/x',
    method: 'GET',
    headers: {},
  });

  it('토큰이 있으면 헤더에 주입한다', () => {
    const store = createAuthTokenStore(mockStore());
    store.set('tok');
    const interceptor = createAuthRequestInterceptor(store);
    expect(interceptor(baseConfig()).headers[AUTH_HEADER]).toBe('tok');
  });

  it('토큰이 없으면 헤더를 추가하지 않는다', () => {
    const store = createAuthTokenStore(mockStore());
    const interceptor = createAuthRequestInterceptor(store);
    expect(interceptor(baseConfig()).headers[AUTH_HEADER]).toBeUndefined();
  });
});
