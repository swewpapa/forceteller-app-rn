import type { TextStyle } from 'react-native';
import { resolveColorPath, type ColorPath } from '@/shared/lib/style-engine/color-path';
import type { Resolver } from '@/shared/lib/style-engine/resolver';

/** ColorPath → 텍스트 color. */
export const textColor: Resolver<ColorPath> = (value, theme): TextStyle => ({
  color: resolveColorPath(value, theme),
});
