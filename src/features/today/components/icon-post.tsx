import { Pressable, StyleSheet, View } from 'react-native';
import { AspectRatio, Column, Image, Typography } from '@/shared/components';
import { radius, spacing, useAppColors } from '@/shared/theme';
import { POST_DARK, TodayPostHeader } from './today-post-header';
import type { IconItem, TodayLink, TodayPost } from '../types/today-types';

type IconPostData = Extract<TodayPost, { type: 'icon' }>;

export type IconPostProps = {
  post: IconPostData;
  onPressLink: (link: TodayLink) => void;
};

const ICON_SIZE = 48; // Figma Portrait 48×48 원형(radius-xl)

type IconRowProps = {
  item: IconItem;
  isDark: boolean;
  dividerColor: string;
  onPressLink: (link: TodayLink) => void;
};

/**
 * 아이콘 1행: 원형 아이콘(48) + 제목(headline-xs, 점수) + 캡션(body-sm). link 있으면 행 전체 탭 → onPressLink.
 * 구분선(상단)은 텍스트 영역에만 → 아이콘 폭만큼 들여쓰기(Figma/Angular 실측). presentational.
 */
function IconRow({ item, isDark, dividerColor, onPressLink }: IconRowProps) {
  const { title, image, caption, link } = item;
  const contentStyle = [styles.content, { borderTopColor: dividerColor }];
  const titleStyle = isDark ? styles.darkText : undefined;
  const captionStyle = isDark ? styles.darkMuted : undefined;

  const body = (
    <>
      <AspectRatio ratio={1} radius="xl" color={isDark ? undefined : 'inset'} style={styles.icon}>
        <Image source={image} accessibilityLabel={title} />
      </AspectRatio>
      <Column style={contentStyle}>
        <Typography variant="headline-xs" numberOfLines={1} style={titleStyle}>
          {title}
        </Typography>
        {caption ? (
          <Typography variant="body-sm" color="muted" numberOfLines={1} style={captionStyle}>
            {caption}
          </Typography>
        ) : null}
      </Column>
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
 * icon 포스트: 공통 헤더 + 아이콘 세로 리스트(원형 아이콘 + 점수/캡션). Figma 840:3101 "Today Post Icon List" 실측
 * (행 px20·gap16, Item Content py20·상단 구분선, Portrait 48 원형). 그리드 아님 — Figma/Angular 모두 세로 리스트.
 * 행별 link로 탭 위임(onPressLink). isDark(예: daily)면 POST_DARK 배경/텍스트. presentational — 데이터/탭 모두 위임.
 */
export function IconPost({ post, onPressLink }: IconPostProps) {
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
          <IconRow
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
    paddingHorizontal: spacing[250],
  },
  icon: { width: ICON_SIZE },
  // 아이콘 높이 이상으로 늘어나 상단 구분선이 행 상단에 정렬. py20로 텍스트 수직 중앙(Figma Item Content).
  content: {
    flex: 1,
    alignSelf: 'stretch',
    justifyContent: 'center',
    paddingVertical: spacing[250],
    borderTopWidth: 1,
  },
  darkText: { color: POST_DARK.text },
  darkMuted: { color: POST_DARK.subtle },
});
