import { type ComponentProps } from 'react';
import { View } from 'react-native';
import { withStyleProps } from '@/shared/lib/style-engine';
import { flexResolvers } from './bindings';

/** 가로 나열(Flutter Row 대응). justify=주축 분배, align=교차축 정렬. */
export const Row = withStyleProps(View, {
  base: { flexDirection: 'row' },
  resolvers: flexResolvers,
});
export type RowProps = ComponentProps<typeof Row>;
Row.displayName = 'Row';
