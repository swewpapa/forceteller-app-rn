import { Column } from '@/shared/components';
import type { ThemeView, ThemeWidget } from '../types/theme-types';
import { ThemeWidgetRenderer } from './theme-widget-renderer';

export type ThemeWidgetListProps = {
  widgets: ThemeWidget[];
  onPressView: (view: ThemeView) => void;
  onPressViewAll?: (widget: ThemeWidget) => void;
};

/** 위젯 세로 나열. 스크롤 컨테이너는 화면(호출부) 관할. */
export function ThemeWidgetList({ widgets, onPressView, onPressViewAll }: ThemeWidgetListProps) {
  return (
    <Column gap="400">
      {widgets.map(widget => (
        <ThemeWidgetRenderer
          key={widget.uuid}
          widget={widget}
          onPressView={onPressView}
          onPressViewAll={onPressViewAll}
        />
      ))}
    </Column>
  );
}
