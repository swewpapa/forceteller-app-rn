import type { ModeColors, ThemeContextValue } from '@/shared/theme';

/** 'text.default' | 'background.surface' | … — ModeColors에서 유도(수기 유니온 아님). */
export type ColorPath = {
  [G in keyof ModeColors]: `${G & string}.${keyof ModeColors[G] & string}`;
}[keyof ModeColors];

/** 모드별 colors 객체 → 플랫 테이블 캐시. day/night colors는 모듈 상수라 모드당 1회 구축. */
const flatCache = new WeakMap<ModeColors, Record<string, string>>();

function buildFlatTable(colors: ModeColors): Record<string, string> {
  const flat: Record<string, string> = {};
  for (const group of Object.keys(colors)) {
    const entries = (colors as Record<string, Record<string, string>>)[group];
    for (const key of Object.keys(entries)) flat[`${group}.${key}`] = entries[key];
  }
  return flat;
}

/** 시맨틱 색 경로 → 색 문자열. cdk palette.get(path) 선례. 구축 후엔 split/할당 0, 단일 lookup. */
export function resolveColorPath(path: ColorPath, theme: ThemeContextValue): string {
  let flat = flatCache.get(theme.colors);
  if (flat === undefined) {
    flat = buildFlatTable(theme.colors);
    flatCache.set(theme.colors, flat);
  }
  return flat[path];
}
