import { View, type ViewStyle } from 'react-native';
import { useAppColors } from '@/shared/theme';
import { buildLayoutStyle, type FlowProps } from './layout-style';

export type RowProps = FlowProps;

/** 가로 나열(Flutter Row 대응). justify=주축 정렬(분배), align=교차축 정렬. */
export function Row({
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
}: RowProps) {
  const colors = useAppColors();
  // undefined 키를 style 객체에 남기지 않기 위해 조건부로만 채운다.
  const flow: ViewStyle = { flexDirection: 'row' };
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
