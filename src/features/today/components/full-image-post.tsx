import { Pressable, StyleSheet, View } from 'react-native';
import { AspectRatio, Image } from '@/shared/components';
import { radius, useAppColors } from '@/shared/theme';
import type { TodayLink, TodayPost } from '@/features/today/types/today-types';
import { POST_DARK, TodayPostHeader } from './today-post-header';

type FullImagePostData = Extract<TodayPost, { type: 'full_image' }>;

export type FullImagePostProps = {
  post: FullImagePostData;
  onPressLink: (link: TodayLink) => void;
};

const FULL_IMAGE_RATIO = 320 / 168; // Figma _Full Image aspect(1.9047) = Angular fixed-ratio 1.9047:1

/**
 * full_image 포스트: 공통 헤더 + 통짜 이미지(320:168 비율). Figma 840:3100 실측.
 * item.link 있으면 카드 전체 탭 → onPressLink, 없으면 정적. presentational(탭 위임).
 */
export function FullImagePost({ post, onPressLink }: FullImagePostProps) {
  const colors = useAppColors();
  const { header, isDark, item } = post;

  const cardStyle = [
    styles.card,
    { backgroundColor: isDark ? POST_DARK.bg : colors.background.surface },
  ];

  const body = (
    <>
      <TodayPostHeader header={header} isDark={isDark} />
      {item ? (
        <AspectRatio ratio={FULL_IMAGE_RATIO}>
          <Image source={item.image} contentFit="cover" accessibilityLabel={header.title} />
        </AspectRatio>
      ) : null}
    </>
  );

  const link = item?.link ?? null;
  if (!link) return <View style={cardStyle}>{body}</View>;
  return (
    <Pressable accessibilityRole="button" onPress={() => onPressLink(link)} style={cardStyle}>
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, overflow: 'hidden' },
});
