// jest용 react-native-mmkv 모킹. id별 in-memory Map으로 동작을 흉내낸다.
const stores = new Map();

function createMMKV(config) {
  const id = (config && config.id) || 'default';
  if (!stores.has(id)) stores.set(id, new Map());
  const m = stores.get(id);
  return {
    getString: (k) => m.get(k),
    set: (k, v) => m.set(k, v),
    remove: (k) => m.delete(k),
    contains: (k) => m.has(k),
    clearAll: () => m.clear(),
  };
}

module.exports = { __esModule: true, createMMKV };
