import { type ComponentProps } from 'react';
import { View } from 'react-native';
import { withStyleProps } from '@/shared/style-engine';
import { boxResolvers } from './bindings';

/** 배경·패딩·radius를 갖는 시각적 컨테이너(Flutter Container 대응). 나열·간격은 Row/Column. */
export const Box = withStyleProps(View, { resolvers: boxResolvers });
export type BoxProps = ComponentProps<typeof Box>;
Box.displayName = 'Box';
