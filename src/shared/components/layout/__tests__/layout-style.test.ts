import type { ModeColors } from '@/shared/theme';
import { buildLayoutStyle } from '../layout-style';

// 빌더는 background 그룹만 조회하므로 최소 fixture로 충분하다.
const colors = {
  background: {
    default: '#101010',
    surface: '#ffffff',
    inset: '#eeeeee',
    highlight: '#ddffdd',
    alert: '#ffdddd',
  },
} as ModeColors;

describe('buildLayoutStyle — padding', () => {
  it('스칼라 토큰을 4변으로 정규화한다', () => {
    expect(buildLayoutStyle({ padding: '300' }, colors)).toStrictEqual({
      paddingTop: 24,
      paddingRight: 24,
      paddingBottom: 24,
      paddingLeft: 24,
    });
  });

  it('스칼라 원시 px를 그대로 쓴다', () => {
    expect(buildLayoutStyle({ padding: 10 }, colors)).toStrictEqual({
      paddingTop: 10,
      paddingRight: 10,
      paddingBottom: 10,
      paddingLeft: 10,
    });
  });

  it('2-value는 [Y, X]다', () => {
    expect(buildLayoutStyle({ padding: ['100', '300'] }, colors)).toStrictEqual({
      paddingTop: 8,
      paddingRight: 24,
      paddingBottom: 8,
      paddingLeft: 24,
    });
  });

  it('3-value는 [top, X, bottom]이다', () => {
    expect(buildLayoutStyle({ padding: ['100', '200', '100'] }, colors)).toStrictEqual({
      paddingTop: 8,
      paddingRight: 16,
      paddingBottom: 8,
      paddingLeft: 16,
    });
  });

  it('4-value는 시계방향 [top, right, bottom, left]다', () => {
    expect(buildLayoutStyle({ padding: ['50', '100', '150', '200'] }, colors)).toStrictEqual({
      paddingTop: 4,
      paddingRight: 8,
      paddingBottom: 12,
      paddingLeft: 16,
    });
  });

  it('토큰/원시 px 혼용을 허용하고 0도 명시 방출한다', () => {
    expect(buildLayoutStyle({ padding: [8, '200', 0] }, colors)).toStrictEqual({
      paddingTop: 8,
      paddingRight: 16,
      paddingBottom: 0,
      paddingLeft: 16,
    });
  });

  it('p는 padding의 alias다', () => {
    expect(buildLayoutStyle({ p: '300' }, colors)).toStrictEqual(
      buildLayoutStyle({ padding: '300' }, colors),
    );
  });

  it('동시 지정 시 padding(풀네임)이 p보다 우선한다', () => {
    expect(buildLayoutStyle({ padding: '100', p: '300' }, colors)).toStrictEqual({
      paddingTop: 8,
      paddingRight: 8,
      paddingBottom: 8,
      paddingLeft: 8,
    });
  });
});

describe('buildLayoutStyle — 기타 토큰', () => {
  it('미지정이면 빈 객체를 반환한다 (undefined 키 없음)', () => {
    expect(buildLayoutStyle({}, colors)).toStrictEqual({});
  });

  it('background는 모드컬러를 조회한다', () => {
    expect(buildLayoutStyle({ background: 'surface' }, colors)).toStrictEqual({
      backgroundColor: '#ffffff',
    });
  });

  it('radius는 토큰을 조회한다', () => {
    expect(buildLayoutStyle({ radius: 'md' }, colors)).toStrictEqual({
      borderRadius: 8,
    });
  });

  it('gap은 토큰을 조회한다', () => {
    expect(buildLayoutStyle({ gap: '300' }, colors)).toStrictEqual({ gap: 24 });
  });

  it('gap은 원시 px도 허용한다', () => {
    expect(buildLayoutStyle({ gap: 10 }, colors)).toStrictEqual({ gap: 10 });
  });
});
