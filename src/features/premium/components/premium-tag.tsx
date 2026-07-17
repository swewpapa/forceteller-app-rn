import { StyleSheet } from 'react-native';
import { Chip, Column, ListHeader, Row } from '@/shared/components';
import type { Premium, PremiumLink } from '../types/premium-types';

type TagPremium = Extract<Premium, { type: 'tag' }>;

export type PremiumTagProps = {
  premium: TagPremium;
  onPressLink: (link: PremiumLink) => void;
};

/**
 * tag 변형: ListHeader + flex-wrap Chip 그리드(태그 칩). tag엔 moreLink 없어 "모두 보기" 없음.
 * Figma 997:9856(Type=Tag)·Angular premium-list-tag 실측: 칩 gap 8(spacing/100) + wrap.
 * keyword_cloud 변형과 동일한 Chip wrap 패턴 — DS Chip을 그대로 재사용(칩 색/치수는 DS SSOT).
 * PremiumTag엔 선택/더보기 플래그가 없어 전 칩 outline. 탭은 onPressLink에 위임
 * (tag.link는 api 타입 — 실제 조회/no-op은 상위 screen 담당).
 */
export function PremiumTag({ premium, onPressLink }: PremiumTagProps) {
  const { title, subtitle, tags } = premium;
  return (
    <Column gap="250">
      <ListHeader title={title} subtitle={subtitle ?? undefined} />
      <Row gap="100" style={styles.wrap}>
        {tags.map((tag, i) => (
          <Chip key={`${tag.text}-${i}`} label={tag.text} onPress={() => onPressLink(tag.link)} />
        ))}
      </Row>
    </Column>
  );
}

const styles = StyleSheet.create({
  // 레이아웃 전용 one-off: Row 프리미티브에 wrap prop이 없어 style 탈출구로 처리(keyword_cloud 선례).
  wrap: { flexWrap: 'wrap' },
});
