import { Column } from '@/shared/components';
import type { Theme, ThemeView } from '../types/theme-types';
import { ThemeWidget } from './theme-widget';

export type ThemeWidgetListProps = {
  themes: Theme[];
  onPressView: (view: ThemeView) => void;
  onPressViewAll?: (theme: Theme) => void;
};

/** 위젯 세로 나열. 스크롤 컨테이너는 화면(호출부) 관할. */
export function ThemeWidgetList({ themes, onPressView, onPressViewAll }: ThemeWidgetListProps) {
  return (
    <Column gap="400">
      {themes.map(theme => (
        <ThemeWidget
          key={theme.uuid}
          theme={theme}
          onPressView={onPressView}
          onPressViewAll={onPressViewAll}
        />
      ))}
    </Column>
  );
}
