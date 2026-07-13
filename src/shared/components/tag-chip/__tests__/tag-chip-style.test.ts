import type { ModeColors } from '@/shared/theme';
import { buildTagChipStyle } from '../tag-chip-style';

const colors = {
  primary: { primary: '#191919', onPrimary: '#ffffff' },
  stroke: { default: '#cccccc' },
  text: { subtle: '#686868' },
} as ModeColors;

describe('buildTagChipStyle', () => {
  it('selected: bg=primary, text=onPrimary, 보더 투명', () => {
    const r = buildTagChipStyle({ selected: true }, colors);
    expect(r.container.backgroundColor).toBe('#191919');
    expect(r.textColor).toBe('#ffffff');
    expect(r.container.borderColor).toBe('transparent');
  });

  it('미선택: bg 투명, 보더=stroke.default, text=text.subtle', () => {
    const r = buildTagChipStyle({ selected: false }, colors);
    expect(r.container.backgroundColor).toBe('transparent');
    expect(r.container.borderColor).toBe('#cccccc');
    expect(r.textColor).toBe('#686868');
  });

  it('두 상태 모두 height 28 / borderWidth 1 (박스 크기 통일)', () => {
    const on = buildTagChipStyle({ selected: true }, colors);
    const off = buildTagChipStyle({ selected: false }, colors);
    expect(on.container.height).toBe(28);
    expect(off.container.height).toBe(28);
    expect(on.container.borderWidth).toBe(1);
    expect(off.container.borderWidth).toBe(1);
  });
});
