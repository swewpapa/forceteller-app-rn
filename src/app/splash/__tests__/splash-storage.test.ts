import { createSplashStorage } from '@/app/splash/splash-storage';
import type { KVStorage } from '@/shared/types';

function fakeKV(): KVStorage {
  const map = new Map<string, string>();
  return {
    getString: (k) => map.get(k),
    set: (k, v) => {
      map.set(k, v);
    },
    remove: (k) => {
      map.delete(k);
    },
  };
}

describe('splash-storage', () => {
  it('returns null when nothing stored', () => {
    expect(createSplashStorage(fakeKV()).read()).toBeNull();
  });

  it('writes then reads meta', () => {
    const s = createSplashStorage(fakeKV());
    s.write({ appliedUrl: 'https://x/img.png', appliedId: 'abc' });
    expect(s.read()).toEqual({ appliedUrl: 'https://x/img.png', appliedId: 'abc' });
  });

  it('returns null when only one key present', () => {
    const kv = fakeKV();
    kv.set('splash.appliedUrl', 'https://x/img.png');
    expect(createSplashStorage(kv).read()).toBeNull();
  });
});
