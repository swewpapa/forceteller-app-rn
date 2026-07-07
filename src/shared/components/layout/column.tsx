import { type ComponentProps } from 'react';
import { View } from 'react-native';
import { align, background, gap, justify, margin, padding, radius, withStyleProps } from '@/shared/lib/style-engine';

/** 세로 나열(Flutter Column 대응). justify=주축 분배, align=교차축 정렬. */
export const Column = withStyleProps(View, {
  base: { flexDirection: 'column' },
  resolvers: { p: padding, padding, m: margin, margin, gap, color: background, radius, justify, align },
});

export type ColumnProps = ComponentProps<typeof Column>;
Column.displayName = 'Column';
