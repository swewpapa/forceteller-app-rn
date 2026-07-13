import type { ModeColors } from '@/shared/theme';
import { buildCheckboxStyle } from '../checkbox-style';

const colors = {
  primary: { primary: '#191919' },
  text: { subtle: '#686868', default: '#191919' },
} as ModeColors;

describe('buildCheckboxStyle', () => {
  it('md: box 20 / label-md', () => {
    const r = buildCheckboxStyle({ checked: true, size: 'md' }, colors);
    expect(r.boxSize).toBe(20);
    expect(r.labelVariant).toBe('label-md');
  });

  it('sm: box 16 / label-sm', () => {
    const r = buildCheckboxStyle({ checked: false, size: 'sm' }, colors);
    expect(r.boxSize).toBe(16);
    expect(r.labelVariant).toBe('label-sm');
  });

  it('checked → iconColor=primary.primary, unchecked → text.subtle', () => {
    expect(buildCheckboxStyle({ checked: true, size: 'md' }, colors).iconColor).toBe('#191919');
    expect(buildCheckboxStyle({ checked: false, size: 'md' }, colors).iconColor).toBe('#686868');
  });

  it('labelColor는 항상 text.default', () => {
    expect(buildCheckboxStyle({ checked: false, size: 'md' }, colors).labelColor).toBe('#191919');
  });
});
