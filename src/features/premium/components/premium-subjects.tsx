import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Row, Typography } from '@/shared/components';
import { useAppColors } from '@/shared/theme';
import type { PremiumSubjectLink, PremiumSubjects } from '../types/premium-types';

type Segment = 'genre' | 'subject';

// 세그먼트별 그리드 규격(Figma 947:4555/4554). genre=2행 아이콘카드, subject=3행 텍스트칩.
const GRID = {
  genre: { rows: 2, cardW: 72, cardH: 64, gap: 4 },
  subject: { rows: 3, cardW: 92, cardH: 40, gap: 6 },
} as const;

const SEG_INDICATOR_W = 100;

export type PremiumSubjectsProps = {
  subjects: PremiumSubjects;
  onPressItem: (link: PremiumSubjectLink) => void;
  onPressViewAll?: (segment: Segment) => void;
};

/**
 * 프리미엄 카테고리(Figma "Premium Subjects Carousel"). 장르/주제 세그먼트 토글 +
 * 가로 스크롤 그리드(genre=2행 아이콘카드, subject=3행 텍스트칩). 데이터=usePremiumSubjects.
 * 그리드 너비를 항목수/행수로 계산해 flexWrap 행수를 제어한다(빈 스크롤 공간 없이).
 */
export function PremiumSubjects({ subjects, onPressItem, onPressViewAll }: PremiumSubjectsProps) {
  const colors = useAppColors();
  const [segment, setSegment] = useState<Segment>('genre');

  const items = segment === 'genre' ? subjects.genres : subjects.keywords;
  const cfg = GRID[segment];
  const columns = Math.max(Math.ceil(items.length / cfg.rows), 1);
  const gridWidth = columns * (cfg.cardW + cfg.gap);
  const gridHeight = cfg.rows * cfg.cardH + (cfg.rows - 1) * cfg.gap;
  const indicatorLeft = segment === 'genre' ? 2 : 2 + SEG_INDICATOR_W + 4;

  return (
    <View style={styles.root}>
      <Row align="center" justify="space-between" style={styles.header}>
        <View style={[styles.segment, { backgroundColor: colors.background.inset }]}>
          <View
            style={[
              styles.segIndicator,
              { backgroundColor: colors.primary.primary, left: indicatorLeft },
            ]}
            pointerEvents="none"
          />
          {(['genre', 'subject'] as const).map((seg) => (
            <Pressable
              key={seg}
              style={styles.segButton}
              accessibilityRole="button"
              accessibilityState={{ selected: segment === seg }}
              onPress={() => setSegment(seg)}
            >
              <Text
                style={[
                  styles.segLabel,
                  { color: segment === seg ? colors.primary.onPrimary : colors.text.muted },
                ]}
              >
                {seg === 'genre' ? '장르별 운세' : '주제별 운세'}
              </Text>
            </Pressable>
          ))}
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => onPressViewAll?.(segment)}
        >
          <Typography variant="label-md" color="subtle">
            모두 보기
          </Typography>
        </Pressable>
      </Row>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.gridScroll}
      >
        <View style={[styles.gridWrap, { width: gridWidth, height: gridHeight, gap: cfg.gap }]}>
          {items.map((item) => (
            <Pressable
              key={`${segment}:${item.name}`}
              accessibilityRole="button"
              onPress={() => item.link && onPressItem(item.link)}
              style={[
                segment === 'genre' ? styles.genreCard : styles.subjectChip,
                { borderColor: colors.stroke.subtle, backgroundColor: colors.background.surface },
              ]}
            >
              {segment === 'genre' && item.iconUrl ? (
                <Image source={{ uri: item.iconUrl }} style={styles.genreIcon} resizeMode="contain" />
              ) : null}
              <Typography variant="label-sm" numberOfLines={1}>
                {item.name}
              </Typography>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { paddingVertical: 8 },
  header: { paddingHorizontal: 20, height: 32 },
  segment: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 208,
    padding: 2,
    borderRadius: 99,
  },
  segIndicator: {
    position: 'absolute',
    top: 2,
    width: SEG_INDICATOR_W,
    height: 28,
    borderRadius: 99,
  },
  segButton: { width: SEG_INDICATOR_W, height: 28, alignItems: 'center', justifyContent: 'center' },
  segLabel: { fontSize: 14, lineHeight: 20, fontWeight: '500', letterSpacing: -0.28 },
  gridScroll: { paddingTop: 12, paddingHorizontal: 20 },
  gridWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  genreCard: {
    width: 72,
    height: 64,
    borderWidth: 1,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    overflow: 'hidden',
  },
  genreIcon: { width: 26, height: 26 },
  subjectChip: {
    width: 92,
    height: 40,
    borderWidth: 1,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
