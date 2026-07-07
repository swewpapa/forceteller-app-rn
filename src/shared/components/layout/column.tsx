import { type ComponentProps } from 'react';
import { View, type ViewProps } from 'react-native';
import {
  backgroundColor,
  flow,
  gap,
  radius,
  spacing,
  withStyleProps,
  type BackgroundColorProps,
  type FlowProps,
  type GapProps,
  type RadiusProps,
  type SpacingProps,
} from '@/shared/lib/style-engine';

/** 세로 나열(Flutter Column 대응). justify=주축 분배, align=교차축 정렬. */
export const Column = withStyleProps<
  SpacingProps & GapProps & BackgroundColorProps & RadiusProps & FlowProps,
  ViewProps
>(View, {
  base: { flexDirection: 'column' },
  resolvers: [spacing, gap, backgroundColor, radius, flow],
});

export type ColumnProps = ComponentProps<typeof Column>;
