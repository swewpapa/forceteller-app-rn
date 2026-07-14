import type { ViewStyle } from 'react-native';
import { spacing as spacingScale } from '@/shared/theme';
import type { Resolver } from '@/shared/lib/style-engine/resolver';
import type { SpaceValue } from './spacing';

/** 토큰 키 또는 원시 px → gap. */
export const gap: Resolver<SpaceValue> = (value): ViewStyle => ({
  gap: typeof value === 'string' ? spacingScale[value] : value,
});
