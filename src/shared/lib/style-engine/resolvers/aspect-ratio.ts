import type { ViewStyle } from 'react-native';
import type { Resolver } from '@/shared/lib/style-engine/resolver';

/** ratio(w/h number) 통과 — 토큰 아닌 레이아웃 비율(alignment 선례). */
export const aspectRatio: Resolver<number> = (value): ViewStyle => ({ aspectRatio: value });
