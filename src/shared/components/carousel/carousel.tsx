import { type ReactElement } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { spacing } from '@/shared/theme';
import { Column } from '../layout';
import { ListHeader } from '../list-header';

export type CarouselProps<T> = {
  title: string;
  subtitle?: string;
  data: T[];
  keyExtractor: (item: T) => string;
  renderCard: (item: T) => ReactElement;
  /** 있으면 헤더 우측에 "모두 보기" 링크를 노출한다(ListHeader에 그대로 위임). */
  onPressViewAll?: () => void;
};

/**
 * carousel 공통 셸: ListHeader + 가로 FlatList. "모두 보기"는 onPressViewAll을 넘길 때만 노출된다
 * (theme carousel은 넘기지 않아 미노출 — Figma linkMore=false; premium carousel은 moreLink가 있으면 노출).
 * 홈이 위젯을 좌우 패딩(spacing[300]) 안에 넣으므로, FlatList는 negative margin으로 그 패딩을
 * 상쇄해 화면 엣지까지 확장하고 contentContainerStyle로 재적용한다 → 첫 카드가 헤더와 좌측
 * 정렬되면서 엣지투엣지 스크롤 + 우측 peek.
 */
export function Carousel<T>({
  title,
  subtitle,
  data,
  keyExtractor,
  renderCard,
  onPressViewAll,
}: CarouselProps<T>) {
  return (
    <Column gap="250">
      <ListHeader title={title} subtitle={subtitle} onPressViewAll={onPressViewAll} />
      <FlatList
        horizontal
        data={data}
        keyExtractor={keyExtractor}
        renderItem={({ item }) => renderCard(item)}
        showsHorizontalScrollIndicator={false}
        style={styles.list}
        contentContainerStyle={styles.content}
      />
    </Column>
  );
}

const styles = StyleSheet.create({
  list: { marginHorizontal: -spacing[300] },
  content: { gap: spacing[200], paddingHorizontal: spacing[300] },
});
