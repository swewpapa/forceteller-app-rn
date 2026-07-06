import type { ModeColors } from '@/shared/theme';
import { buildTextFieldStyle } from '../text-field-style';

// 리졸버는 background/text/stroke/primary 그룹만 조회하므로 최소 fixture로 충분하다.
const colors = {
  background: { surface: '#ffffff', inset: '#f4f4f4' },
  text: { default: '#191919', subtle: '#686868', muted: '#adadad' },
  stroke: { default: '#cccccc', alert: '#ed7e7e' },
  primary: { primary: '#191919' },
} as ModeColors;

const base = { error: false, focused: false, disabled: false };

describe('buildTextFieldStyle — 상태별 색', () => {
  it('default: border stroke.default, input text.default, placeholder text.muted, bg surface', () => {
    const r = buildTextFieldStyle({ ...base }, colors);
    expect(r.container.borderColor).toBe('#cccccc');
    expect(r.inputColor).toBe('#191919');
    expect(r.placeholderColor).toBe('#adadad');
    expect(r.container.backgroundColor).toBe('#ffffff');
  });

  it('focused: border primary.primary', () => {
    expect(buildTextFieldStyle({ ...base, focused: true }, colors).container.borderColor).toBe('#191919');
  });

  it('error: border stroke.alert', () => {
    expect(buildTextFieldStyle({ ...base, error: true }, colors).container.borderColor).toBe('#ed7e7e');
  });

  it('error가 focused보다 우선: 에러+포커스 → alert', () => {
    expect(
      buildTextFieldStyle({ ...base, error: true, focused: true }, colors).container.borderColor,
    ).toBe('#ed7e7e');
  });

  it('disabled: bg inset, border stroke.default, input text.muted', () => {
    const r = buildTextFieldStyle({ ...base, disabled: true }, colors);
    expect(r.container.backgroundColor).toBe('#f4f4f4');
    expect(r.container.borderColor).toBe('#cccccc');
    expect(r.inputColor).toBe('#adadad');
    expect(r.placeholderColor).toBe('#adadad');
  });

  it('disabled가 error보다 우선: disabled+error → border default, bg inset', () => {
    const r = buildTextFieldStyle({ ...base, disabled: true, error: true }, colors);
    expect(r.container.borderColor).toBe('#cccccc');
    expect(r.container.backgroundColor).toBe('#f4f4f4');
    expect(r.inputColor).toBe('#adadad');
  });

  it('disabled가 focused보다 우선: disabled+focused → border default, bg inset, input muted', () => {
    const r = buildTextFieldStyle({ ...base, disabled: true, focused: true }, colors);
    expect(r.container.borderColor).toBe('#cccccc');
    expect(r.container.backgroundColor).toBe('#f4f4f4');
    expect(r.inputColor).toBe('#adadad');
  });
});

describe('buildTextFieldStyle — 공통 컨테이너', () => {
  it('height 48, px 16, radius 8, borderWidth 1, row + center + gap 8', () => {
    const c = buildTextFieldStyle({ ...base }, colors).container;
    expect(c.height).toBe(48);
    expect(c.paddingHorizontal).toBe(16);
    expect(c.borderRadius).toBe(8);
    expect(c.borderWidth).toBe(1);
    expect(c.flexDirection).toBe('row');
    expect(c.alignItems).toBe('center');
    expect(c.gap).toBe(8);
  });
});
