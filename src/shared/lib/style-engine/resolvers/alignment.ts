import type { ViewStyle } from 'react-native';
import type { Resolver } from '@/shared/lib/style-engine/resolver';

/** 주축 분배 통과(토큰 아님). */
export const justify: Resolver<NonNullable<ViewStyle['justifyContent']>> = (value): ViewStyle => ({
  justifyContent: value,
});

/** 교차축 정렬 통과(토큰 아님). */
export const align: Resolver<NonNullable<ViewStyle['alignItems']>> = (value): ViewStyle => ({
  alignItems: value,
});
