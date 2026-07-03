import { View, type ViewStyle } from 'react-native';
import { useAppColors } from '@/shared/theme';
import { buildLayoutStyle, type FlowProps } from './layout-style';

export type ColumnProps = FlowProps;

/** 세로 나열(Flutter Column 대응). justify=주축 정렬(분배), align=교차축 정렬. */
export function Column({
  padding,
  p,
  background,
  radius,
  gap,
  justify,
  align,
  style,
  children,
  ...rest
}: ColumnProps) {
  const colors = useAppColors();
  // RN 기본값이 column이지만 명시성 우선. undefined 키는 남기지 않는다.
  const flow: ViewStyle = { flexDirection: 'column' };
  if (justify !== undefined) {
    flow.justifyContent = justify;
  }
  if (align !== undefined) {
    flow.alignItems = align;
  }
  return (
    <View
      style={[flow, buildLayoutStyle({ padding, p, background, radius, gap }, colors), style]}
      {...rest}
    >
      {children}
    </View>
  );
}
