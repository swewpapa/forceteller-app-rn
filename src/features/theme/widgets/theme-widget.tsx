import { ActivityIndicator } from 'react-native';
import { Button, Column, Typography } from '@/shared/components';
import { useThemeListByCode } from '../hooks/useThemeListByCode';
import type { ThemeView } from '../types/theme-types';
import { ThemeRenderer } from '../components/theme-renderer';

export type ThemeWidgetProps = {
  code: string;
  onPressView: (view: ThemeView) => void;
};

/**
 * 테마 위젯: code로 Theme[]를 자체 페칭해 변형들을 세로 나열한다.
 * feature 유일의 query 결합 컴포넌트(widgets/) — 순수 컴포넌트는 components/.
 * 리전마다 독립 로딩/에러 — 한 리전이 느려도 나머지는 먼저 표시된다.
 */
export function ThemeWidget({ code, onPressView }: ThemeWidgetProps) {
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
  return (
    <Column gap="400">
      {query.data.map((theme) => (
        <ThemeRenderer key={theme.uuid} theme={theme} onPressView={onPressView} />
      ))}
    </Column>
  );
}
