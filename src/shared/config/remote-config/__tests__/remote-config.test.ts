import { normalizeConfig, remoteConfig } from '../remote-config';

// dev 실응답(GET /api/config/firebase) 발췌 기반.
describe('normalizeConfig', () => {
  it('type별 강제변환 (BOOLEAN/STRING/JSON)', () => {
    expect(
      normalizeConfig({
        parameters: [
          { key: 'use_donation', type: 'BOOLEAN', value: true },
          { key: 'free_fortune_count', type: 'STRING', value: '1,185' },
          { key: 'free_force_config', type: 'JSON', value: { appBarButtonType: 'lottie' } },
        ],
      }),
    ).toEqual({
      use_donation: true,
      free_fortune_count: '1,185',
      free_force_config: { appBarButtonType: 'lottie' },
    });
  });

  it('BOOLEAN 문자열 "true"/"false"도 boolean으로', () => {
    expect(
      normalizeConfig({
        parameters: [
          { key: 'a', type: 'BOOLEAN', value: 'true' },
          { key: 'b', type: 'BOOLEAN', value: 'false' },
        ],
      }),
    ).toEqual({ a: true, b: false });
  });

  it('NUMBER 변환, NaN이면 드롭', () => {
    expect(
      normalizeConfig({
        parameters: [
          { key: 'n', type: 'NUMBER', value: '42' },
          { key: 'bad', type: 'NUMBER', value: 'xx' },
        ],
      }),
    ).toEqual({ n: 42 });
  });

  it('미지 type / key 없음 / JSON이 객체 아님 → 드롭', () => {
    expect(
      normalizeConfig({
        parameters: [
          { key: 'x', type: 'WEIRD', value: 1 },
          { type: 'STRING', value: 'no-key' },
          { key: 'j', type: 'JSON', value: null },
          { key: 'j2', type: 'JSON', value: 'not-object' },
        ],
      }),
    ).toEqual({});
  });

  it('parameters 부재 → 빈 객체', () => {
    expect(normalizeConfig({})).toEqual({});
  });
});

describe('remoteConfig 게터', () => {
  beforeEach(() => remoteConfig.apply({}));

  it('타입 일치 시 값, 불일치/부재 시 기본값', () => {
    remoteConfig.apply({
      flag: true,
      name: 'x',
      count: 3,
      cfg: { a: 1 },
      wrongBool: 'nope',
    });
    expect(remoteConfig.getBool('flag')).toBe(true);
    expect(remoteConfig.getBool('missing')).toBe(false);
    expect(remoteConfig.getBool('missing', true)).toBe(true);
    expect(remoteConfig.getBool('wrongBool')).toBe(false); // 타입 불일치 → 기본값
    expect(remoteConfig.getString('name')).toBe('x');
    expect(remoteConfig.getString('flag', 'def')).toBe('def');
    expect(remoteConfig.getNumber('count')).toBe(3);
    expect(remoteConfig.getNumber('missing', 9)).toBe(9);
    expect(remoteConfig.getJSON('cfg', {})).toEqual({ a: 1 });
    expect(remoteConfig.getJSON('name', { fallback: true })).toEqual({ fallback: true });
  });
});
