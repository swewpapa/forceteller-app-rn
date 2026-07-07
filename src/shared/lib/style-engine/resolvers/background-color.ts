import type { ViewStyle } from 'react-native';
import type { ModeColors } from '@/shared/theme';
import type { Resolver } from '../resolver';

/** background 시맨틱 그룹 키(예: 'surface'). 레이아웃 컨테이너 배경 전용. */
export type BackgroundKey = keyof ModeColors['background'];
export type BackgroundColorProps = { color?: BackgroundKey };

/**
 * prop `color`(그룹키) → backgroundColor. 레이아웃 색 prop.
 * ⚠️ 전환기: 엔진에 이미 `color` 리졸버(props background/borderColor, ColorPath)가 있음 —
 * export명↔prop명이 엇갈리는 건 Chip 우회(ColorPath)의 잔재. 무채색 chip 토큰 후속에서 통일.
 * 각 아톰은 하나만 사용(레이아웃=backgroundColor, Chip=color)이라 런타임 충돌 없음.
 */
export const backgroundColor: Resolver<BackgroundColorProps> = {
  props: ['color'],
  resolve(values, theme): ViewStyle {
    return values.color ? { backgroundColor: theme.colors.background[values.color] } : {};
  },
};
