export type ThemeLink =
  | { type: 'url'; value: string; queryParams?: Record<string, string> }
  | { type: 'tag_filter'; value: string };

/** 서버 themeViews[]의 아이템 단위. 리스트 UI가 쓰는 필드만(hits/like/description 등은 필요 시 후속 추가). */
export type ThemeView = {
  id: number;
  viewId: number;
  title: string;
  subtitle: string | null;
  /** label_text+label_color 쌍이 모두 있을 때만. color는 서버 드리븐 hex. */
  label: { text: string; color: string } | null;
  thumbnailImage: string | null;
  fullImage: string | null;
  link: ThemeLink;
  isNew: boolean;
};

export type ThemeKeyword = {
  text: string;
  /** raw class === 'more' — "더보기" pill */
  isMore: boolean;
  link: ThemeLink;
};

type ThemeWidgetBase = {
  id: number;
  uuid: string;
  title: string;
  subtitle: string | null;
};

/** /api/theme/list/{code}의 위젯 단위. type은 위젯 렌더러 지시자(서버 드리븐). */
export type ThemeWidget =
  | (ThemeWidgetBase & { type: 'text_only'; views: ThemeView[] })
  | (ThemeWidgetBase & { type: 'thumbnail_carousel'; views: ThemeView[] })
  | (ThemeWidgetBase & { type: 'full_image_carousel'; views: ThemeView[] })
  | (ThemeWidgetBase & { type: 'keyword_cloud'; keywords: ThemeKeyword[] });
