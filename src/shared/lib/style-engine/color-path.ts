import type { ModeColors, ThemeContextValue } from '@/shared/theme';

/** 'text.default' | 'background.surface' | … — ModeColors에서 유도(수기 유니온 아님). */
export type ColorPath = {
  [G in keyof ModeColors]: `${G & string}.${keyof ModeColors[G] & string}`;
}[keyof ModeColors];

/** 시맨틱 색 경로 → 색 문자열. cdk palette.get(path) 선례. */
export function resolveColorPath(path: ColorPath, theme: ThemeContextValue): string {
  const [group, key] = path.split('.') as [keyof ModeColors, string];
  return (theme.colors[group] as Record<string, string>)[key];
}
