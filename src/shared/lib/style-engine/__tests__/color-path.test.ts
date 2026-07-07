import { resolveColorPath } from '../color-path';
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
});
