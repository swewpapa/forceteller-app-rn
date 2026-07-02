import { createThemeStorage, type KVStore } from '../theme-storage';

function fakeStore(): KVStore {
  const map = new Map<string, string>();
  return {
    getString: (k) => map.get(k),
    set: (k, v) => {
      map.set(k, v);
    },
  };
}

describe('theme-storage', () => {
  it('defaults to system when nothing stored', () => {
    expect(createThemeStorage(fakeStore()).getMode()).toBe('system');
  });

  it('persists and reads back a mode', () => {
    const s = createThemeStorage(fakeStore());
    s.setMode('night');
    expect(s.getMode()).toBe('night');
  });

  it('falls back to system on an unknown stored value', () => {
    const store = fakeStore();
    store.set('theme.mode', 'neon');
    expect(createThemeStorage(store).getMode()).toBe('system');
  });
});
