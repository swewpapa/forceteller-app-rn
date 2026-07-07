import type { ViewStyle } from 'react-native';
import { spacing as spacingScale } from '@/shared/theme';
import type { Resolver } from '../resolver';
import type { SpaceValue } from './spacing';

export type GapProps = { gap?: SpaceValue };

export const gap: Resolver<GapProps> = {
  props: ['gap'],
  resolve(values, _theme): ViewStyle {
    if (values.gap === undefined) return {};
    return { gap: typeof values.gap === 'string' ? spacingScale[values.gap] : values.gap };
  },
};
