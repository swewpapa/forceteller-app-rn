import { type ComponentProps } from 'react';
import { View } from 'react-native';
import { aspectRatio, background, radius, withStyleProps } from '@/shared/style-engine';

/** 비율 상자 — ratio(w/h number) 유지 + radius/color 토큰. 자식(이미지 등) 주입, overflow:hidden으로 radius 클립. app/en AspectRatio 계승. */
export const AspectRatio = withStyleProps(View, {
  base: { overflow: 'hidden' },
  resolvers: { ratio: aspectRatio, radius, color: background },
});
export type AspectRatioProps = ComponentProps<typeof AspectRatio>;
AspectRatio.displayName = 'AspectRatio';
