import type { ViewStyle } from 'react-native';
import type { RadiusKey } from '@/shared/theme';
import type { Resolver } from '../resolver';

export type RadiusProps = { radius?: RadiusKey };

export const radius: Resolver<RadiusProps> = {
  props: ['radius'],
  resolve(values, theme): ViewStyle {
    return values.radius ? { borderRadius: theme.radius[values.radius] } : {};
  },
};
