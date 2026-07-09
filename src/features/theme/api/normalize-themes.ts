import type {
  Theme,
  ThemeKeyword,
  ThemeLink,
  ThemeView,
} from '../types/theme-types';

// ─── raw 타입: 서버 응답 그대로. api/ 내부 전용 — feature 배럴로 반출 금지 ───

export type RawThemeLink = {
  type?: string;
  value?: string;
  params?: { queryParams?: Record<string, string> };
};

export type RawThemeKeyword = {
  text?: string;
  class?: string;
  link?: RawThemeLink;
};

export type RawThemeView = {
  id?: number;
  viewId?: number;
  title?: string;
  subtitle?: string | null;
  label_text?: string;
  label_color?: string;
  thumbnail_image?: string;
  full_image?: string;
  isNew?: boolean;
  link?: RawThemeLink;
  keywords?: RawThemeKeyword[];
};

export type RawTheme = {
  id?: number;
  uuid?: string;
  type?: string;
  title?: string;
  subtitle?: string | null;
  themeViews?: RawThemeView[];
};

export type ThemeListResponse = { status: number; data: RawTheme[] };

// ─── 정규화 ───

const CONTENT_TYPES = [
  'text_only',
  'thumbnail_carousel',
  'full_image_carousel',
] as const;
type ContentType = (typeof CONTENT_TYPES)[number];

function isContentType(type: string): type is ContentType {
  return (CONTENT_TYPES as readonly string[]).includes(type);
}

function emptyToNull(value: string | null | undefined): string | null {
  return value ? value : null;
}

function normalizeLink(link: RawThemeLink | undefined): ThemeLink | null {
  if (!link?.type || !link.value) return null;
  if (link.type === 'url') {
    const queryParams = link.params?.queryParams;
    return { type: 'url', value: link.value, ...(queryParams ? { queryParams } : {}) };
  }
  if (link.type === 'tag_filter') return { type: 'tag_filter', value: link.value };
  return null; // unknown link type → 호출부에서 항목 드롭
}

function normalizeView(view: RawThemeView): ThemeView | null {
  const link = normalizeLink(view.link);
  if (!link) return null;
  if (view.id === undefined || view.viewId === undefined || !view.title) return null;
  return {
    id: view.id,
    viewId: view.viewId,
    title: view.title,
    subtitle: emptyToNull(view.subtitle),
    label:
      view.label_text && view.label_color
        ? { text: view.label_text, color: view.label_color }
        : null,
    thumbnailImage: emptyToNull(view.thumbnail_image),
    fullImage: emptyToNull(view.full_image),
    link,
    isNew: view.isNew ?? false,
  };
}

function normalizeKeyword(keyword: RawThemeKeyword): ThemeKeyword | null {
  const link = normalizeLink(keyword.link);
  if (!link || !keyword.text) return null;
  return { text: keyword.text, isMore: keyword.class === 'more', link };
}

/**
 * raw 테마 목록 → 도메인 Theme[].
 * 렌더 불가능한 단위는 이 경계에서 드롭한다: unknown type(forward compat),
 * 빈 themeViews, link 없는 view/keyword. 스펙 §5 참조.
 */
export function normalizeThemes(raw: RawTheme[]): Theme[] {
  const themes: Theme[] = [];
  for (const w of raw) {
    if (w.id === undefined || !w.uuid || !w.title || !w.type) continue;
    const rawViews = w.themeViews ?? [];
    if (rawViews.length === 0) continue;
    const base = { id: w.id, uuid: w.uuid, title: w.title, subtitle: emptyToNull(w.subtitle) };

    if (w.type === 'keyword_cloud') {
      const keywords = (rawViews[0]?.keywords ?? [])
        .map(normalizeKeyword)
        .filter((k): k is ThemeKeyword => k !== null);
      if (keywords.length === 0) continue;
      themes.push({ ...base, type: 'keyword_cloud', keywords });
    } else if (isContentType(w.type)) {
      const views = rawViews
        .map(normalizeView)
        .filter((v): v is ThemeView => v !== null);
      if (views.length === 0) continue;
      themes.push({ ...base, type: w.type, views });
    }
    // unknown type → drop
  }
  return themes;
}
