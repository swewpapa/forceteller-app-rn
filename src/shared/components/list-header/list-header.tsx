import { Pressable } from 'react-native';
import { Column, Row } from '@/shared/components/layout';
import { Typography } from '@/shared/components/typography';

export type ListHeaderProps = {
  title: string;
  subtitle?: string;
  /** 있으면 우측에 "모두 보기" 링크를 렌더한다. */
  onPressViewAll?: () => void;
};

/** 리스트/위젯 섹션 헤더: subtitle(위) + title(아래) + 선택적 "모두 보기". */
export function ListHeader({ title, subtitle, onPressViewAll }: ListHeaderProps) {
  return (
    <Row justify="space-between" align="flex-end">
      <Column gap="50">
        {subtitle ? (
          <Typography variant="body-sm" color="subtle">
            {subtitle}
          </Typography>
        ) : null}
        <Typography variant="headline-md">{title}</Typography>
      </Column>
      {onPressViewAll ? (
        <Pressable accessibilityRole="button" onPress={onPressViewAll}>
          <Typography variant="label-md" color="subtle">
            모두 보기
          </Typography>
        </Pressable>
      ) : null}
    </Row>
  );
}
