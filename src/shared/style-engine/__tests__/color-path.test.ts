import { resolveColorPath } from '@/shared/style-engine/color-path';
import type { ThemeContextValue } from '@/shared/theme';

const theme = {
  colors: {
    text: { default: '#191919', muted: '#adadad' },
    background: { surface: '#ffffff' },
    stroke: { subtle: '#e8e8e8' },
  },
} as unknown as ThemeContextValue;

describe('resolveColorPath', () => {
  it('그룹.키 경로를 색 문자열로 해석한다', () => {
    expect(resolveColorPath('text.default', theme)).toBe('#191919');
    expect(resolveColorPath('background.surface', theme)).toBe('#ffffff');
    expect(resolveColorPath('stroke.subtle', theme)).toBe('#e8e8e8');
  });

  it('교차 그룹 lookup — 서로 다른 그룹 경로가 각각 올바른 값(플랫 테이블 단일 lookup)', () => {
    // 한 번 구축된 플랫 테이블이 그룹 경계를 넘어 정확히 해석하는지 확인.
    expect(resolveColorPath('text.muted', theme)).toBe('#adadad');
    expect(resolveColorPath('background.surface', theme)).toBe('#ffffff');
    expect(resolveColorPath('stroke.subtle', theme)).toBe('#e8e8e8');
  });

  it('같은 theme.colors 반복 호출 시 일관된 값 반환(WeakMap 캐시 정확성)', () => {
    // 첫 호출이 플랫 테이블을 구축, 이후 호출은 캐시 lookup — 값이 흔들리지 않아야 한다.
    const first = resolveColorPath('text.default', theme);
    expect(resolveColorPath('text.default', theme)).toBe(first);
    expect(resolveColorPath('text.default', theme)).toBe('#191919');
    // 캐시 구축 이후에도 다른 그룹 키가 정확히 해석된다(테이블 전체가 구축됨).
    expect(resolveColorPath('background.surface', theme)).toBe('#ffffff');
  });

  it('서로 다른 theme.colors 객체는 캐시가 분리된다(WeakMap 키=colors 아이덴티티 → 모드 전환 안전)', () => {
    // day/night는 서로 다른 colors 객체다. 한쪽 플랫 테이블이 다른 쪽으로 새면 모드 전환 시 stale 색이 된다.
    const day = { colors: { background: { surface: '#ffffff' } } } as unknown as ThemeContextValue;
    const night = {
      colors: { background: { surface: '#0b0b0b' } },
    } as unknown as ThemeContextValue;
    expect(resolveColorPath('background.surface', day)).toBe('#ffffff'); // day 테이블 구축
    expect(resolveColorPath('background.surface', night)).toBe('#0b0b0b'); // night는 자기 값(day 캐시 미유출)
    expect(resolveColorPath('background.surface', day)).toBe('#ffffff'); // 역방향 재확인 — 각자 자기 값 유지
  });
});
