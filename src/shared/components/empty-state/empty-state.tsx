import { type ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { Column } from '@/shared/components/layout';
import { Typography } from '@/shared/components/typography';
import { useAppColors } from '@/shared/theme';

export type EmptyStateProps = {
  /** 상단 아이콘(FA). 48px, text.muted. */
  icon: IconDefinition;
  /** 제목(headline-xs). */
  title: string;
  /** 설명(body-md, 옵션). */
  description?: string;
  /** 하단 액션 슬롯(LinkText/Button 등, 옵션). */
  action?: ReactNode;
};

/**
 * 빈 상태 플레이스홀더 — 아이콘 + 제목/설명 + 선택 액션의 세로 중앙 스택(Figma 312:7166).
 * 아이콘·텍스트는 모두 text.muted, 액션은 소비처가 slot으로 주입(예: LinkText '출석 체크하기').
 */
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  const colors = useAppColors();
  return (
    <Column align="center" gap="250" style={styles.root}>
      <FontAwesomeIcon icon={icon} size={48} color={colors.text.muted} />
      <Column align="center" gap="50" style={styles.textBlock}>
        <Typography variant="headline-xs" color="muted" style={styles.centerText}>
          {title}
        </Typography>
        {description ? (
          <Typography variant="body-md" color="muted" style={styles.centerText}>
            {description}
          </Typography>
        ) : null}
      </Column>
      {action}
    </Column>
  );
}

const styles = StyleSheet.create({
  root: { maxWidth: 320, width: '100%', alignSelf: 'center' },
  textBlock: { width: '100%' },
  centerText: { textAlign: 'center' },
});
