import { Pressable, StyleSheet, Text } from 'react-native';
import { AspectRatio, Column, Image } from '@/shared/components';
import { spacing, typographyStyles, useAppColors } from '@/shared/theme';
import type { ThemeView } from '../types/theme-types';

const CARD_WIDTH = 144;
const IMAGE_RATIO = 144 / 92; // Figma 실측(원시 px)

export type ThumbnailCardProps = { view: ThemeView; onPress: () => void };

/** 썸네일 카드: 이미지(144/92) + 라벨(서버색) + 제목(2줄). ListItem 라벨 패턴 계승(crown 아이콘 생략). */
export function ThumbnailCard({ view, onPress }: ThumbnailCardProps) {
  const colors = useAppColors();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.card}>
      <AspectRatio ratio={IMAGE_RATIO} radius="md">
        <Image source={view.thumbnailImage} accessibilityLabel={view.title} />
      </AspectRatio>
      <Column gap="50">
        {view.label ? (
          <Text style={[typographyStyles['label-sm'], { color: view.label.color ?? colors.text.subtle }]}>
            {view.label.text}
          </Text>
        ) : null}
        <Text numberOfLines={2} style={[typographyStyles['headline-xs'], { color: colors.text.default }]}>
          {view.title}
        </Text>
      </Column>
    </Pressable>
  );
}

const styles = StyleSheet.create({ card: { width: CARD_WIDTH, gap: spacing[150] } });
