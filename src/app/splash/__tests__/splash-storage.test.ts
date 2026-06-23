import { createSplashStorage, type KVStore } from '../splash-storage';

function fakeStore(): KVStore {
  const map = new Map<string, string>();
  return {
    getString: (k) => map.get(k),
    set: (k, v) => {
      map.set(k, v);
    },
  };
}

describe('splash-storage', () => {
  it('returns null when nothing stored', () => {
    expect(createSplashStorage(fakeStore()).read()).toBeNull();
  });

  it('writes then reads meta', () => {
    const s = createSplashStorage(fakeStore());
    s.write({ appliedUrl: 'https://x/img.png', appliedId: 'abc' });
    expect(s.read()).toEqual({ appliedUrl: 'https://x/img.png', appliedId: 'abc' });
  });

  it('returns null when only one key present', () => {
    const store = fakeStore();
    store.set('splash.appliedUrl', 'https://x/img.png');
    expect(createSplashStorage(store).read()).toBeNull();
  });
});
