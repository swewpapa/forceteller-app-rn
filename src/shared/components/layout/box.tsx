import { View } from 'react-native';
import { useAppColors } from '@/shared/theme';
import { buildLayoutStyle, type SharedLayoutProps } from './layout-style';

export type BoxProps = SharedLayoutProps;

/** 배경·패딩·radius를 갖는 시각적 컨테이너(Flutter Container 대응). 나열·간격은 Row/Column 관할. */
export function Box({ padding, p, background, radius, style, children, ...rest }: BoxProps) {
  const colors = useAppColors();
  return (
    <View style={[buildLayoutStyle({ padding, p, background, radius }, colors), style]} {...rest}>
      {children}
    </View>
  );
}
