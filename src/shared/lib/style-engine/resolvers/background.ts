import type { ViewStyle } from 'react-native';
import type { ModeColors } from '@/shared/theme';
import type { Resolver } from '../resolver';

/** background 시맨틱 그룹 키(예: 'surface'). */
export type BackgroundKey = keyof ModeColors['background'];

/** 그룹키 → backgroundColor. prop 이름은 컴포넌트가 바인딩(레이아웃 `color`, Chip `background` 등). */
export const background: Resolver<BackgroundKey> = (value, theme): ViewStyle => ({
  backgroundColor: theme.colors.background[value],
});
