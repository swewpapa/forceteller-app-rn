import type { ViewStyle } from 'react-native';
import { resolveColorPath, type ColorPath } from '../color-path';
import type { Resolver } from '../resolver';

export type ColorProps = { background?: ColorPath; borderColor?: ColorPath };

export const color: Resolver<ColorProps> = {
  props: ['background', 'borderColor'],
  resolve(values, theme): ViewStyle {
    const style: ViewStyle = {};
    if (values.background) style.backgroundColor = resolveColorPath(values.background, theme);
    if (values.borderColor) style.borderColor = resolveColorPath(values.borderColor, theme);
    return style;
  },
};
