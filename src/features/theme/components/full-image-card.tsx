import { Pressable, StyleSheet } from 'react-native';
import { AspectRatio, Image } from '@/shared/components';
import type { ThemeView } from '../types/theme-types';

const CARD_WIDTH = 240;
const IMAGE_RATIO = 240 / 126; // Figma 실측(원시 px)

export type FullImageCardProps = { view: ThemeView; onPress: () => void };

/** 풀이미지 카드: 가로 이미지(240/126)만. 텍스트는 이미지에 구워짐(오버레이 없음). */
export function FullImageCard({ view, onPress }: FullImageCardProps) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.card}>
      <AspectRatio ratio={IMAGE_RATIO} radius="md">
        <Image source={view.fullImage} accessibilityLabel={view.title} />
      </AspectRatio>
    </Pressable>
  );
}

const styles = StyleSheet.create({ card: { width: CARD_WIDTH } });
