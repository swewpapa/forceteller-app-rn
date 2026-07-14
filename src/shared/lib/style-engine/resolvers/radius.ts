import type { ViewStyle } from 'react-native';
import type { RadiusKey } from '@/shared/theme';
import type { Resolver } from '@/shared/lib/style-engine/resolver';

/** radius 토큰 키 → borderRadius. */
export const radius: Resolver<RadiusKey> = (value, theme): ViewStyle => ({
  borderRadius: theme.radius[value],
});
