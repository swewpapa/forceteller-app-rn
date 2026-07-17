import { StyleSheet } from 'react-native';
import { Chip, Column, ListHeader, Row } from '@/shared/components';
import type { Theme, ThemeKeyword } from '../types/theme-types';

type KeywordCloudTheme = Extract<Theme, { type: 'keyword_cloud' }>;

export type KeywordCloudProps = {
  theme: KeywordCloudTheme;
  onPressKeyword: (keyword: ThemeKeyword) => void;
};

/** keyword_cloud 변형: ListHeader + flex-wrap Chip 목록. isMore → solid("더보기"). */
export function KeywordCloud({ theme, onPressKeyword }: KeywordCloudProps) {
  return (
    <Column gap="150">
      <ListHeader title={theme.title} subtitle={theme.subtitle ?? undefined} />
      <Row gap="100" style={styles.wrap}>
        {theme.keywords.map((keyword, i) => (
          <Chip
            key={`${keyword.text}-${i}`}
            label={keyword.text}
            appearance={keyword.isMore ? 'solid' : 'outline'}
            onPress={() => onPressKeyword(keyword)}
          />
        ))}
      </Row>
    </Column>
  );
}

const styles = StyleSheet.create({
  // 레이아웃 전용 one-off: Row 프리미티브에 wrap prop이 없어 style 탈출구로 처리.
  wrap: { flexWrap: 'wrap' },
});
