// today 탭 서버드리븐 포스트 피드의 도메인 타입.
// raw 서버 응답 타입은 api/normalize-today.ts 내부에만 존재하고, 여기엔 정규화된 도메인 형태만 둔다.

/**
 * 포스트/아이템의 탭 타깃.
 * - `url`: Web 네비게이션(기존).
 * - `api`: 액션 호출(`method` `endpoint`) → `GET /api/today/post/{id}` 재조회로 포스트 교체.
 *   api 링크는 chat/gift 전용이 아니라 포스트 타입 무관 공통(Martin 확정).
 */
export type TodayLink =
  | {
      type: 'url';
      value: string;
      /** icon 아이템의 `params.state` 등 라우팅 파라미터. 있으면 원형 그대로 보존. */
      params?: Record<string, unknown>;
    }
  | {
      type: 'api';
      /** 호출 엔드포인트(raw link.value). */
      endpoint: string;
      /** HTTP 메서드(raw link.method, 기본 POST). */
      method: string;
      params?: Record<string, unknown>;
    };

/** api 액션 링크(TodayLink의 api variant). 인터랙션(gift 클레임·chat 선택) 실행에 사용. */
export type TodayApiLink = Extract<TodayLink, { type: 'api' }>;

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

/** gift 버튼(쿠폰 받기/사용하기 등). action=api면 클레임/네비, disabled면 비활성. */
export type GiftButton = {
  text: string;
  /** 원본 아이콘 URL(참고). 실제 렌더는 FA 매핑(svg URL은 RN Image 미지원). */
  iconUrl: string | null;
  disabled: boolean;
  action: TodayLink | null;
};
/** gift 티켓 아이템. amount는 HTML 스트립("X7"), color는 수량 강조 hex. */
export type GiftItem = {
  title: string;
  amount: string;
  color: string;
  iconUrl: string | null;
  buttons: GiftButton[];
};

/** chat 말풍선 — 텍스트 또는 이미지. */
export type ChatMessage =
  | { kind: 'text'; text: string }
  | { kind: 'image'; src: string };
/** carousel 선택 카드(탭 시 action api 호출). */
export type ChatCard = { src: string; action: TodayApiLink };
/**
 * chat 피커.
 * - tarot: 단일 카드(스와이프) + "이 카드로 할게요" 확정 버튼(submit).
 * - carousel: 이미지 여러 장 — 탭 자체가 선택(각 카드에 action).
 */
export type ChatPicker =
  | { kind: 'tarot'; caption: string; cardSrc: string; submitText: string; submit: TodayApiLink }
  | { kind: 'carousel'; caption: string; cards: ChatCard[] };

export type TodayPost =
  // 컨텐츠(item/items)는 옵션 — header만 있으면 렌더(헤더 전용 카드 허용).
  | (TodayPostBase & { type: 'full_image'; item: FullImageItem | null })
  | (TodayPostBase & { type: 'thumbnail'; items: ThumbnailItem[] })
  | (TodayPostBase & { type: 'icon'; items: IconItem[] })
  | (TodayPostBase & { type: 'weather'; item: WeatherItem | null })
  | (TodayPostBase & { type: 'gift'; items: GiftItem[] })
  | (TodayPostBase & {
      type: 'chat';
      bgColor: string | null;
      messages: ChatMessage[];
      picker: ChatPicker;
    });
