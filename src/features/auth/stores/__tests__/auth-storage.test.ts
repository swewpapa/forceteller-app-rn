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
  it('초기에는 null을 반환한다', () => {
    expect(createAuthStorage(fakeKV()).get()).toBeNull();
  });

  it('set 후 get으로 토큰을 읽는다', () => {
    const storage = createAuthStorage(fakeKV());
    storage.set('tok');
    expect(storage.get()).toBe('tok');
  });

  it('clear 후에는 null을 반환한다', () => {
    const storage = createAuthStorage(fakeKV());
    storage.set('tok');
    storage.clear();
    expect(storage.get()).toBeNull();
  });
});
