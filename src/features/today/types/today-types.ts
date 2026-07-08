// today 탭 서버드리븐 포스트 피드의 도메인 타입.
// raw 서버 응답 타입은 api/normalize-today.ts 내부에만 존재하고, 여기엔 정규화된 도메인 형태만 둔다.

/** 포스트/아이템의 탭 타깃. Phase1 표시형은 url 링크만 다룬다(api 등은 normalize에서 드롭→null). */
export type TodayLink = {
  type: 'url';
  value: string;
  /** icon 아이템의 `params.state` 등 라우팅 파라미터. 있으면 원형 그대로 보존. */
  params?: Record<string, unknown>;
};

export type TodayHeader = {
  title: string;
  subtitle: string | null;
  portrait: string | null;
  bgImage: string | null;
};

type TodayPostBase = { id: number; header: TodayHeader; isDark: boolean };

export type FullImageItem = { image: string; link: TodayLink | null };
export type ThumbnailItem = {
  title: string;
  image: string | null;
  price: number;
  link: TodayLink | null;
};
export type IconItem = {
  title: string;
  image: string;
  caption: string;
  link: TodayLink | null;
};
export type WeatherItem = {
  temp: string;
  caption: string;
  image: string;
  link: TodayLink | null;
};

export type TodayPost =
  | (TodayPostBase & { type: 'full_image'; item: FullImageItem })
  | (TodayPostBase & { type: 'thumbnail'; items: ThumbnailItem[] })
  | (TodayPostBase & { type: 'icon'; items: IconItem[] })
  | (TodayPostBase & { type: 'weather'; item: WeatherItem });
