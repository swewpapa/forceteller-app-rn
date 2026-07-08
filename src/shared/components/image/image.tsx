import { StyleSheet } from 'react-native';
import { Image as ExpoImage, type ImageContentFit } from 'expo-image';

export type ImageProps = {
  /** 서버 드리븐 uri. null이면 렌더 안 함(부모 AspectRatio color가 빈 배경). */
  source: string | null;
  contentFit?: ImageContentFit;
  accessibilityLabel?: string;
};

/** expo-image 얇은 래핑. 비율/클립은 부모(AspectRatio) 담당 — 채우기 전용. */
export function Image({ source, contentFit = 'cover', accessibilityLabel }: ImageProps) {
  if (!source) return null;
  return (
    <ExpoImage
      source={{ uri: source }}
      contentFit={contentFit}
      accessibilityLabel={accessibilityLabel}
      style={styles.fill}
    />
  );
}

const styles = StyleSheet.create({
  // 부모(AspectRatio)를 가득 채운다. 정적값이라 StyleSheet로 분리(no-inline-styles 경고 방지).
  fill: { width: '100%', height: '100%' },
});
