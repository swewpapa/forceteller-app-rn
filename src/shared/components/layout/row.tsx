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

/** 가로 나열(Flutter Row 대응). justify=주축 분배, align=교차축 정렬. */
export const Row = withStyleProps<
  SpacingProps & GapProps & BackgroundColorProps & RadiusProps & FlowProps,
  ViewProps
>(View, {
  base: { flexDirection: 'row' },
  resolvers: [spacing, gap, backgroundColor, radius, flow],
});

export type RowProps = ComponentProps<typeof Row>;
