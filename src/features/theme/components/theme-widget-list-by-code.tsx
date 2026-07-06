import { ActivityIndicator } from 'react-native';
import { Button, Column, Typography } from '@/shared/components';
import { useThemeListByCode } from '../hooks/useThemeListByCode';
import type { ThemeView } from '../types/theme-types';
import { ThemeWidgetList } from './theme-widget-list';

export type ThemeWidgetListByCodeProps = {
  code: string;
  onPressView: (view: ThemeView) => void;
};

/**
 * code로 위젯 목록을 자체 페칭해 렌더하는 컨테이너 (홈 등 다중 리전용).
 * 리전마다 독립 로딩/에러 — 한 리전이 느려도 나머지는 먼저 표시된다.
 */
export function ThemeWidgetListByCode({ code, onPressView }: ThemeWidgetListByCodeProps) {
  const query = useThemeListByCode(code);

  if (query.isPending) {
    return <ActivityIndicator />;
  }
  if (query.isError) {
    return (
      <Column gap="150">
        <Typography variant="body-md" color="subtle">
          테마를 불러오지 못했어요.
        </Typography>
        <Button
          label="다시 시도"
          color="secondary"
          appearance="outline"
          size="sm"
          onPress={() => query.refetch()}
        />
      </Column>
    );
  }
  return <ThemeWidgetList themes={query.data} onPressView={onPressView} />;
}
