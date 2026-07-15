import {
  resolveTagLabelVariant,
  tagLabelVariants,
} from '@/shared/components/tag-label/tag-label-style';

describe('tag-label-style', () => {
  it('빌트인 키 → 프리셋 조회', () => {
    expect(resolveTagLabelVariant('default')).toEqual({
      background: 'background.inset',
      text: 'text.muted',
    });
    expect(resolveTagLabelVariant('highlighted')).toBe(tagLabelVariants.highlighted);
  });

  it('커스텀 객체 → 그대로 통과(확장)', () => {
    const custom = { background: 'accent.fireTonal', text: 'accent.onFireTonal' } as const;
    expect(resolveTagLabelVariant(custom)).toBe(custom);
  });
});
