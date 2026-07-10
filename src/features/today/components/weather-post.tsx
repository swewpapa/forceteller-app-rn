import { Pressable, StyleSheet, View } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowRight } from '@fortawesome/pro-light-svg-icons/faArrowRight';
import { AspectRatio, Column, Image, Row, Typography } from '@/shared/components';
import { radius, spacing, useAppColors } from '@/shared/theme';
import { POST_DARK, TodayPostHeader } from './today-post-header';
import type { TodayLink, TodayPost } from '../types/today-types';

type WeatherPostData = Extract<TodayPost, { type: 'weather' }>;

export type WeatherPostProps = {
  post: WeatherPostData;
  onPressLink: (link: TodayLink) => void;
};

const WEATHER_ICON_SIZE = 48; // Figma Icon 48×48 / Angular ion-img 3rem
const ARROW_SIZE = 12; // Figma arrow-right 12×12

/**
 * weather 포스트: bgImage 헤더 + 날씨 상세 행(아이콘 48 + 온도/미세먼지 + 이동 화살표).
 * Figma 856:792 + Angular today-post-icon-list-item 실측(px20·gap16·py20, 아이콘 48).
 * isDark(실데이터 true)면 카드/텍스트 다크. item.link 있으면 카드 전체 탭 + 화살표 노출.
 * presentational — 탭은 onPressLink에 위임.
 */
export function WeatherPost({ post, onPressLink }: WeatherPostProps) {
  const colors = useAppColors();
  const { header, isDark, item } = post;

  const cardStyle = [
    styles.card,
    { backgroundColor: isDark ? POST_DARK.bg : colors.background.surface },
  ];
  const tempStyle = isDark ? styles.darkText : undefined;
  const captionStyle = isDark ? styles.darkMuted : undefined;
  const arrowColor = isDark ? POST_DARK.subtle : colors.text.muted;
  const link = item?.link ?? null;

  const body = (
    <>
      <TodayPostHeader header={header} isDark={isDark} />
      {item ? (
        <Row align="center" gap="200" style={styles.body}>
          <AspectRatio ratio={1} style={styles.icon}>
            <Image source={item.image} contentFit="contain" accessibilityLabel={item.temp} />
          </AspectRatio>
          <Row align="center" gap="200" style={styles.itemContent}>
            <Column style={styles.text}>
              <Typography variant="headline-xs" numberOfLines={1} style={tempStyle}>
                {item.temp}
              </Typography>
              {item.caption ? (
                <Typography variant="body-sm" color="muted" numberOfLines={1} style={captionStyle}>
                  {item.caption}
                </Typography>
              ) : null}
            </Column>
            {item.link ? (
              <FontAwesomeIcon icon={faArrowRight} size={ARROW_SIZE} color={arrowColor} />
            ) : null}
          </Row>
        </Row>
      ) : null}
    </>
  );

  if (!link) return <View style={cardStyle}>{body}</View>;
  return (
    <Pressable accessibilityRole="button" onPress={() => onPressLink(link)} style={cardStyle}>
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, overflow: 'hidden' },
  body: { paddingHorizontal: spacing[250] },
  icon: { width: WEATHER_ICON_SIZE },
  itemContent: { flex: 1, paddingVertical: spacing[250] },
  text: { flex: 1 },
  darkText: { color: POST_DARK.text },
  darkMuted: { color: POST_DARK.subtle },
});
