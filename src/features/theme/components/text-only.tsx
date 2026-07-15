import { Column, ListHeader, ListItem } from '@/shared/components';
import type { Theme, ThemeView } from '@/features/theme/types/theme-types';

type TextOnlyTheme = Extract<Theme, { type: 'text_only' }>;

export type TextOnlyProps = {
  theme: TextOnlyTheme;
  onPressView: (view: ThemeView) => void;
  onPressViewAll?: (theme: TextOnlyTheme) => void;
};

/** text_only 변형: ListHeader + 라벨/제목 텍스트 행 목록. */
export function TextOnly({ theme, onPressView, onPressViewAll }: TextOnlyProps) {
  return (
    <Column gap="150">
      <ListHeader
        title={theme.title}
        subtitle={theme.subtitle ?? undefined}
        onPressViewAll={onPressViewAll ? () => onPressViewAll(theme) : undefined}
      />
      <Column>
        {theme.views.map((view) => (
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
