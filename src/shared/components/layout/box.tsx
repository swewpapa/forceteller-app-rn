import { type ComponentProps } from 'react';
import { View, type ViewProps } from 'react-native';
import {
  backgroundColor,
  radius,
  spacing,
  withStyleProps,
  type BackgroundColorProps,
  type RadiusProps,
  type SpacingProps,
} from '@/shared/lib/style-engine';

/** 배경·패딩·radius를 갖는 시각적 컨테이너(Flutter Container 대응). 나열·간격은 Row/Column. */
export const Box = withStyleProps<SpacingProps & BackgroundColorProps & RadiusProps, ViewProps>(View, {
  resolvers: [spacing, backgroundColor, radius],
});

export type BoxProps = ComponentProps<typeof Box>;
Box.displayName = 'Box';
