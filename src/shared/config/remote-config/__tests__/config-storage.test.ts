import { createConfigStorage, type KVStore } from '@/shared/config/remote-config/config-storage';

function fakeKV(): KVStore & { data: Record<string, string> } {
  const data: Record<string, string> = {};
  return {
    data,
    getString: (k) => data[k],
    set: (k, v) => {
      data[k] = v;
    },
  };
}

describe('createConfigStorage', () => {
  it('write→read 라운드트립(provider별 키)', () => {
    const kv = fakeKV();
    const s = createConfigStorage(kv);
    s.write('firebase', { use_donation: true });
    expect(kv.data['config.firebase']).toBe(JSON.stringify({ use_donation: true }));
    expect(s.read('firebase')).toEqual({ use_donation: true });
  });

  it('캐시 없으면 null', () => {
    expect(createConfigStorage(fakeKV()).read('firebase')).toBeNull();
  });

  it('깨진 JSON이면 null', () => {
    const kv = fakeKV();
    kv.set('config.firebase', '{bad');
    expect(createConfigStorage(kv).read('firebase')).toBeNull();
  });
});
