// src/shared/components/typography/typography.tsx
import type { ReactNode } from 'react';
import { Text, type StyleProp, type TextProps, type TextStyle } from 'react-native';
import { useAppColors, type ModeColors } from '@/shared/theme';
import { typographyStyles, type TypographyVariant } from './generated/typography';

export type TypographyProps = Omit<TextProps, 'style' | 'children'> & {
  variant: TypographyVariant;
  color?: keyof ModeColors['text'];
  /**
   * 레이아웃 전용 탈출구(margin/flex/position 등). 색상·폰트 등 시각적 정체성은
   * variant/color로만 결정한다 — style로 덮어써도 되지만 그 용도로 쓰지 말 것.
   * 병합 순서상 항상 마지막이라 여기 넣은 값이 우선 적용된다.
   */
  style?: StyleProp<TextStyle>;
  children: ReactNode;
};

export function Typography({
  variant,
  color = 'default',
  style,
  children,
  ...rest
}: TypographyProps) {
  const colors = useAppColors();
  return (
    <Text
      style={[typographyStyles[variant], { color: colors.text[color] }, style]}
      {...rest}
    >
      {children}
    </Text>
  );
}
