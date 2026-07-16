import { createThemeStorage } from '@/shared/theme/theme-storage';
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

describe('theme-storage', () => {
  it('defaults to system when nothing stored', () => {
    expect(createThemeStorage(fakeKV()).getMode()).toBe('system');
  });

  it('persists and reads back a mode', () => {
    const s = createThemeStorage(fakeKV());
    s.setMode('night');
    expect(s.getMode()).toBe('night');
  });

  it('falls back to system on an unknown stored value', () => {
    const kv = fakeKV();
    kv.set('theme.mode', 'neon');
    expect(createThemeStorage(kv).getMode()).toBe('system');
  });
});
