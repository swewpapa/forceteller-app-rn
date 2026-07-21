import { createAuthStorage } from '@/features/auth/stores/auth-storage';
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

describe('createAuthStorage', () => {
  it('초기에는 access/refresh/provider 모두 null을 반환한다', () => {
    const storage = createAuthStorage(fakeKV());
    expect(storage.getAccessToken()).toBeNull();
    expect(storage.getRefreshToken()).toBeNull();
    expect(storage.getProvider()).toBeNull();
  });

  it('setTokenPair 후 access/refresh를 각각 읽는다 (서로 다른 키 — 동일 키 복붙 버그 회귀)', () => {
    const storage = createAuthStorage(fakeKV());
    storage.setTokenPair({ accessToken: 'acc', refreshToken: 'ref' });
    expect(storage.getAccessToken()).toBe('acc');
    expect(storage.getRefreshToken()).toBe('ref');
  });

  it('refreshToken이 null이면 이전 refresh 토큰을 제거한다(이전 세션 잔존 방지)', () => {
    const storage = createAuthStorage(fakeKV());
    storage.setTokenPair({ accessToken: 'acc-1', refreshToken: 'ref-1' });
    storage.setTokenPair({ accessToken: 'acc-2', refreshToken: null });
    expect(storage.getAccessToken()).toBe('acc-2');
    expect(storage.getRefreshToken()).toBeNull();
  });

  it('setSession은 토큰 쌍과 로그인 수단을 함께 저장한다', () => {
    const storage = createAuthStorage(fakeKV());
    storage.setSession({ accessToken: 'acc', refreshToken: 'ref', provider: 'google' });
    expect(storage.getAccessToken()).toBe('acc');
    expect(storage.getRefreshToken()).toBe('ref');
    expect(storage.getProvider()).toBe('google');
  });

  it('setTokenPair(갱신)는 저장된 provider를 건드리지 않는다', () => {
    const storage = createAuthStorage(fakeKV());
    storage.setSession({ accessToken: 'acc', refreshToken: 'ref', provider: 'google' });
    storage.setTokenPair({ accessToken: 'acc-new', refreshToken: 'ref-new' });
    expect(storage.getProvider()).toBe('google');
  });

  it('clear 후에는 access/refresh/provider 모두 null (잔존 없음)', () => {
    const storage = createAuthStorage(fakeKV());
    storage.setSession({ accessToken: 'acc', refreshToken: 'ref', provider: 'google' });
    storage.clear();
    expect(storage.getAccessToken()).toBeNull();
    expect(storage.getRefreshToken()).toBeNull();
    expect(storage.getProvider()).toBeNull();
  });

  it('빈/비문자열 access 토큰은 명확한 에러를 던진다(MMKV 크립틱 크래시 가드)', () => {
    const storage = createAuthStorage(fakeKV());
    expect(() => storage.setTokenPair({ accessToken: '', refreshToken: null })).toThrow(/토큰/);
    expect(() =>
      storage.setTokenPair({ accessToken: undefined as unknown as string, refreshToken: null }),
    ).toThrow(/토큰/);
    expect(() =>
      storage.setSession({ accessToken: '', refreshToken: null, provider: 'google' }),
    ).toThrow(/토큰/);
  });
});
