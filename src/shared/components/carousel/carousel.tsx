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
};

/**
 * carousel 공통 셸: ListHeader + 가로 FlatList. 헤더에 '모두 보기' 없음(Figma linkMore=false).
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
}: CarouselProps<T>) {
  return (
    <Column gap="250">
      <ListHeader title={title} subtitle={subtitle} />
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
