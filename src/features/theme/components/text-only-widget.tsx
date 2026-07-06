import { Column, ListHeader, ListItem } from '@/shared/components';
import type { ThemeView, ThemeWidget } from '../types/theme-types';

type TextOnlyWidgetData = Extract<ThemeWidget, { type: 'text_only' }>;

export type TextOnlyWidgetProps = {
  widget: TextOnlyWidgetData;
  onPressView: (view: ThemeView) => void;
  onPressViewAll?: (widget: TextOnlyWidgetData) => void;
};

/** text_only 위젯: ListHeader + 라벨/제목 텍스트 행 목록. */
export function TextOnlyWidget({ widget, onPressView, onPressViewAll }: TextOnlyWidgetProps) {
  return (
    <Column gap="150">
      <ListHeader
        title={widget.title}
        subtitle={widget.subtitle ?? undefined}
        onPressViewAll={onPressViewAll ? () => onPressViewAll(widget) : undefined}
      />
      <Column>
        {widget.views.map(view => (
          <ListItem
            key={view.viewId}
            label={view.label?.text}
            labelColor={view.label?.color}
            title={view.title}
            onPress={() => onPressView(view)}
          />
        ))}
      </Column>
    </Column>
  );
}
