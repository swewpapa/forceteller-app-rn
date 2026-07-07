import { type ComponentProps } from 'react';
import { View } from 'react-native';
import { withStyleProps } from '@/shared/lib/style-engine';
import { flexResolvers } from './bindings';

/** 세로 나열(Flutter Column 대응). justify=주축 분배, align=교차축 정렬. */
export const Column = withStyleProps(View, { base: { flexDirection: 'column' }, resolvers: flexResolvers });
export type ColumnProps = ComponentProps<typeof Column>;
Column.displayName = 'Column';
