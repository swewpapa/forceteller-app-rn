import { Pressable, StyleSheet, View } from 'react-native';
import { AspectRatio, Image, PriceTag, Row, Typography } from '@/shared/components';
import { radius, spacing, useAppColors } from '@/shared/theme';
import { POST_DARK, TodayPostHeader } from './today-post-header';
import type { ThumbnailItem, TodayLink, TodayPost } from '../types/today-types';

type ThumbnailPostData = Extract<TodayPost, { type: 'thumbnail' }>;

export type ThumbnailPostProps = {
  post: ThumbnailPostData;
  onPressLink: (link: TodayLink) => void;
};

const THUMB_WIDTH = 74; // Figma _List Thumbnail 74×48
const THUMB_RATIO = 74 / 48; // 74×48 (w/h)
const ROW_HEIGHT = 72; // Figma Today Post Thumbnail List Item h-72
const PRICE_TAG_SIZE = '14' as const; // Figma Price Tag slot 43×14 = 가로형 size '14'

type ThumbnailRowProps = {
  item: ThumbnailItem;
  isDark: boolean;
  dividerColor: string;
  onPressLink: (link: TodayLink) => void;
};

/**
 * 썸네일 1행: 이미지(74×48) + 제목(2줄) + PriceTag(price>0). link 있으면 행 전체 탭 → onPressLink.
 * 구분선(상단)은 Contents에만 → 이미지 폭만큼 들여쓰기(Figma/Angular 실측). presentational.
 */
function ThumbnailRow({ item, isDark, dividerColor, onPressLink }: ThumbnailRowProps) {
  const { title, image, price, link } = item;
  const contentsStyle = [styles.contents, { borderTopColor: dividerColor }];
  const titleStyle = [styles.title, isDark ? styles.darkText : null];

  const body = (
    <>
      <AspectRatio
        ratio={THUMB_RATIO}
        radius="md"
        color={isDark ? undefined : 'inset'}
        style={styles.thumb}
      >
        <Image source={image} accessibilityLabel={title} />
      </AspectRatio>
      <Row align="center" gap="200" style={contentsStyle}>
        <Typography variant="body-md" numberOfLines={2} style={titleStyle}>
          {title}
        </Typography>
        {price > 0 ? <PriceTag price={price} size={PRICE_TAG_SIZE} inversed={isDark} /> : null}
      </Row>
    </>
  );

  if (!link) return <View style={styles.row}>{body}</View>;
  return (
    <Pressable accessibilityRole="button" onPress={() => onPressLink(link)} style={styles.row}>
      {body}
    </Pressable>
  );
}

/**
 * thumbnail 포스트: 공통 헤더 + 썸네일 리스트. Figma 839:229 / 840:2936 실측
 * (행 h-72·px20·gap16, Contents py16·상단 구분선, _List Thumbnail 74×48 radius-md, PriceTag slot 43×14).
 * 행별 link로 탭 위임(onPressLink). isDark(예: id 196)면 POST_DARK 배경/텍스트 + inversed PriceTag.
 * price>0일 때만 PriceTag(서버 price=0 무료 흔함 → 미표시 정상). presentational — 데이터/탭 모두 위임.
 */
export function ThumbnailPost({ post, onPressLink }: ThumbnailPostProps) {
  const colors = useAppColors();
  const { header, isDark, items } = post;

  const cardStyle = [
    styles.card,
    { backgroundColor: isDark ? POST_DARK.bg : colors.background.surface },
  ];
  const dividerColor = isDark ? POST_DARK.divider : colors.stroke.subtle;

  return (
    <View style={cardStyle}>
      <TodayPostHeader header={header} isDark={isDark} />
      <View style={styles.list}>
        {items.map((item, index) => (
          <ThumbnailRow
            key={`${item.title}-${index}`}
            item={item}
            isDark={isDark}
            dividerColor={dividerColor}
            onPressLink={onPressLink}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, overflow: 'hidden' },
  list: { paddingBottom: spacing[100] }, // Figma Post Body Container pb-8
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[200],
    height: ROW_HEIGHT,
    paddingHorizontal: spacing[250],
  },
  thumb: { width: THUMB_WIDTH },
  // 행 높이(72) 채움(alignSelf) → 상단 구분선이 행 상단에 정렬. py16로 제목/가격 수직 중앙.
  contents: {
    flex: 1,
    alignSelf: 'stretch',
    paddingVertical: spacing[200],
    borderTopWidth: 1,
  },
  title: { flex: 1 },
  darkText: { color: POST_DARK.text },
});
