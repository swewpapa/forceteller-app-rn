import type { TextStyle } from 'react-native';
import { resolveColorPath, type ColorPath } from '../color-path';
import type { Resolver } from '../resolver';

export type TextColorProps = { color?: ColorPath };

export const textColor: Resolver<TextColorProps> = {
  props: ['color'],
  resolve(values, theme): TextStyle {
    return values.color ? { color: resolveColorPath(values.color, theme) } : {};
  },
};
