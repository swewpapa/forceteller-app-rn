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

describe('buildLayoutStyle — 병합/엣지', () => {
  it('복합 지정 시 모든 토큰이 병합된다', () => {
    expect(
      buildLayoutStyle(
        { padding: '100', gap: '50', background: 'surface', radius: 'md' },
        colors,
      ),
    ).toStrictEqual({
      paddingTop: 8,
      paddingRight: 8,
      paddingBottom: 8,
      paddingLeft: 8,
      gap: 4,
      backgroundColor: '#ffffff',
      borderRadius: 8,
    });
  });

  it('스칼라 0도 명시 방출한다 (falsy 가드 회귀 방지)', () => {
    expect(buildLayoutStyle({ padding: 0, gap: 0 }, colors)).toStrictEqual({
      paddingTop: 0,
      paddingRight: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      gap: 0,
    });
  });
});

/**
 * 컴파일 계약(음성 케이스). 호출하지 않는 함수라 런타임 실행은 없다.
 * 아래 @ts-expect-error 라인이 에러가 아니게 되면(누군가 타입을 넓히면)
 * "Unused '@ts-expect-error' directive"로 tsc 자체가 실패해 회귀를 잡는다.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function compileTimeContract() {
  // @ts-expect-error 스케일 밖 spacing 토큰 키 불허
  buildLayoutStyle({ padding: '301' }, colors);
  // @ts-expect-error 5-tuple padding 불허
  buildLayoutStyle({ padding: ['50', '50', '50', '50', '50'] }, colors);
  // @ts-expect-error radius 스케일에 없는 키 불허
  buildLayoutStyle({ radius: 'sm' }, colors);
  // @ts-expect-error background 그룹에 없는 키 불허
  buildLayoutStyle({ background: 'primary' }, colors);
  // @ts-expect-error radius는 원시 숫자 불허 (토큰 온리)
  buildLayoutStyle({ radius: 8 }, colors);
}
