import { type ComponentProps } from 'react';
import { View } from 'react-native';
import { align, background, gap, justify, margin, padding, radius, withStyleProps } from '@/shared/lib/style-engine';

/** 가로 나열(Flutter Row 대응). justify=주축 분배, align=교차축 정렬. */
export const Row = withStyleProps(View, {
  base: { flexDirection: 'row' },
  resolvers: { p: padding, padding, m: margin, margin, gap, color: background, radius, justify, align },
});

export type RowProps = ComponentProps<typeof Row>;
Row.displayName = 'Row';
