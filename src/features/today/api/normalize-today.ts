import type {
  ChatCard,
  ChatMessage,
  ChatPicker,
  FullImageItem,
  GiftButton,
  GiftItem,
  IconItem,
  ThumbnailItem,
  TodayApiLink,
  TodayHeader,
  TodayLink,
  TodayPost,
  WeatherItem,
} from '../types/today-types';

// ─── raw 타입: 서버 응답 그대로. api/ 내부 전용 — feature 배럴/도메인 밖 반출 금지 ───

type RawTodayLink = {
  type?: string;
  value?: string;
  params?: Record<string, unknown>;
  method?: string; // api 링크(chat 등)의 HTTP 메서드 — 도메인 미반영
  analytics?: unknown; // GA 이벤트 — 도메인 미반영
};

type RawTodayHeader = {
  title?: string;
  subtitle?: string | null;
  portrait?: string | null;
  bgImage?: string | null;
  bgColor?: string; // 일부 header에 존재 — 도메인 미반영
};

// 지원 서브타입(full_image/thumbnail/icon/weather)의 아이템을 아우르는 permissive raw shape.
// chat/gift의 아이템(중첩 배열·버튼 등)은 body 접근 전 type/subtype으로 드롭되므로 여기 오지 않는다.
type RawTodayItem = {
  title?: string;
  image?: string | null; // thumbnail은 null 가능
  caption?: string;
  price?: number;
  link?: RawTodayLink;
  promo?: unknown; // thumbnail raw에 존재 — 도메인 미반영
};

type RawTodayBody = {
  bgColor?: string;
  items?: RawTodayItem[];
};

// gift 아이템/버튼 raw(별도 shape — body.items를 이 타입으로 캐스팅해 접근).
type RawGiftButton = {
  text?: string;
  icon?: string | null;
  disabled?: boolean;
  link?: RawTodayLink;
};
type RawGiftItem = {
  title?: string;
  amount?: string;
  color?: string;
  icon?: string | null;
  buttons?: RawGiftButton[];
};

// chat 아이템 raw(중첩 배열 — body.items를 RawChatEl[][]로 캐스팅). [0]=말풍선, [1]=피커.
type RawChatAction = {
  t?: string; // 'button' | 'image'
  src?: string;
  link?: RawTodayLink;
  button?: { text?: string; type?: string; link?: RawTodayLink };
};
type RawChatEl = {
  v?: string; // 텍스트 버블 / 캡션
  t?: string; // 'image' | 'tarot' | 'carousel'
  src?: string; // 이미지/타로 src
  link?: RawTodayLink; // 이미지 버블 링크
  a?: RawChatAction[]; // 피커 액션(캡션 요소에 존재)
};

export type RawTodayPost = {
  id?: number;
  type?: string;
  subtype?: string;
  status?: string;
  header?: RawTodayHeader;
  body?: RawTodayBody;
  isDark?: boolean;
};

export type TodayResponse = { status: number; data: RawTodayPost[] };

// GET /api/today/post/{id} 단일 응답(액션 후 재조회용). 봉투는 posts와 동일 가정.
// TODO(QA): 단일 엔드포인트 응답 형태가 다르면 여기서 교정.
export type TodayPostResponse = { status: number; data: RawTodayPost };

// ─── 정규화 ───

function emptyToNull(value: string | null | undefined): string | null {
  return value ? value : null;
}

/** HTML 태그 제거("<b>X7</b>" → "X7"). gift amount 등. */
function stripHtml(value: string | undefined): string {
  return (value ?? '').replace(/<[^>]*>/g, '').trim();
}

// url=Web 네비, api=액션(method+endpoint). value 없거나 미지 type이면 null.
function normalizeLink(link: RawTodayLink | undefined): TodayLink | null {
  if (!link || !link.value) return null;
  if (link.type === 'url') {
    return link.params
      ? { type: 'url', value: link.value, params: link.params }
      : { type: 'url', value: link.value };
  }
  if (link.type === 'api') {
    const api = { type: 'api' as const, endpoint: link.value, method: link.method ?? 'POST' };
    return link.params ? { ...api, params: link.params } : api;
  }
  return null;
}

// title 없으면 null → 포스트 드롭. 빈 문자열/부재 subtitle·portrait·bgImage는 null.
function normalizeHeader(header: RawTodayHeader | undefined): TodayHeader | null {
  const title = header?.title;
  if (!title) return null;
  return {
    title,
    subtitle: emptyToNull(header?.subtitle),
    portrait: emptyToNull(header?.portrait),
    bgImage: emptyToNull(header?.bgImage),
  };
}

// full_image: items[0]의 image가 존재해야 유효. image 없으면 null → 포스트 드롭.
function normalizeFullImage(items: RawTodayItem[] | undefined): FullImageItem | null {
  const first = items?.[0];
  const image = emptyToNull(first?.image);
  if (!image) return null;
  return { image, link: normalizeLink(first?.link) };
}

// thumbnail: 주 콘텐츠인 title이 빈 문자열/부재면 개별 드롭(icon의 image 가드와 대칭).
// image는 null 허용, price는 기본 0. 결과가 비면 호출부에서 포스트 드롭.
function normalizeThumbnailItems(items: RawTodayItem[] | undefined): ThumbnailItem[] {
  const result: ThumbnailItem[] = [];
  for (const item of items ?? []) {
    const title = item.title;
    if (!title) continue;
    result.push({
      title,
      image: emptyToNull(item.image),
      price: item.price ?? 0,
      link: normalizeLink(item.link),
    });
  }
  return result;
}

// icon: IconItem.image는 필수 — image 없는 아이템은 렌더 불가라 개별 드롭.
function normalizeIconItems(items: RawTodayItem[] | undefined): IconItem[] {
  const result: IconItem[] = [];
  for (const item of items ?? []) {
    const image = emptyToNull(item.image);
    if (!image) continue;
    result.push({
      title: item.title ?? '',
      image,
      caption: item.caption ?? '',
      link: normalizeLink(item.link),
    });
  }
  return result;
}

// weather: items[0] 하나만. temp는 raw item.title("25º 비"). image 없으면 null → 포스트 드롭.
function normalizeWeather(items: RawTodayItem[] | undefined): WeatherItem | null {
  const first = items?.[0];
  const image = emptyToNull(first?.image);
  if (!image) return null;
  return {
    temp: first?.title ?? '',
    caption: first?.caption ?? '',
    image,
    link: normalizeLink(first?.link),
  };
}

// gift 버튼: text 없으면 개별 드롭. link는 url/api 모두 보존(action). icon URL은 참고용.
function normalizeGiftButtons(buttons: RawGiftButton[] | undefined): GiftButton[] {
  const result: GiftButton[] = [];
  for (const b of buttons ?? []) {
    if (!b.text) continue;
    result.push({
      text: b.text,
      iconUrl: emptyToNull(b.icon),
      disabled: b.disabled ?? false,
      action: normalizeLink(b.link),
    });
  }
  return result;
}

// gift: 티켓 아이템. title 없으면 개별 드롭. amount는 HTML 스트립, color는 hex 그대로.
function normalizeGiftItems(items: RawGiftItem[] | undefined): GiftItem[] {
  const result: GiftItem[] = [];
  for (const item of items ?? []) {
    if (!item.title) continue;
    result.push({
      title: item.title,
      amount: stripHtml(item.amount),
      color: item.color ?? '',
      iconUrl: emptyToNull(item.icon),
      buttons: normalizeGiftButtons(item.buttons),
    });
  }
  return result;
}

// chat 말풍선: 이미지 버블(t=image) 또는 텍스트 버블(v). 그 외 무시.
function normalizeChatMessages(group: RawChatEl[] | undefined): ChatMessage[] {
  const result: ChatMessage[] = [];
  for (const el of group ?? []) {
    if (el.t === 'image' && el.src) result.push({ kind: 'image', src: el.src });
    else if (el.v) result.push({ kind: 'text', text: el.v });
  }
  return result;
}

// chat 액션은 api 링크만(선택/확정). url/미지/부재면 null.
function toApiAction(link: RawTodayLink | undefined): TodayApiLink | null {
  const l = normalizeLink(link);
  return l && l.type === 'api' ? l : null;
}

// chat 피커: tarot(단일 카드 + submit 버튼) 또는 carousel(캡션 요소 a[]의 이미지 탭선택). 둘 다 아니면 null.
function normalizeChatPicker(group: RawChatEl[] | undefined): ChatPicker | null {
  if (!group) return null;
  const captionEl = group.find((e) => e.v);
  const caption = captionEl?.v ?? '';
  const tarotEl = group.find((e) => e.t === 'tarot' && e.src);
  if (tarotEl?.src) {
    const button = captionEl?.a?.find((a) => a.t === 'button')?.button;
    const submit = toApiAction(button?.link);
    if (!submit) return null;
    return { kind: 'tarot', caption, cardSrc: tarotEl.src, submitText: button?.text ?? '선택', submit };
  }
  const cards: ChatCard[] = [];
  for (const a of captionEl?.a ?? []) {
    if (a.t === 'image' && a.src) {
      const action = toApiAction(a.link);
      if (action) cards.push({ src: a.src, action });
    }
  }
  if (cards.length === 0) return null;
  return { kind: 'carousel', caption, cards };
}

/**
 * raw today 포스트 목록 → 도메인 TodayPost[].
 * type(+icon subtype)으로 도메인 type을 정하고, 렌더 불가능/미지원 단위는 이 경계에서 드롭한다:
 *   - 미지원 type(gift/chat) 및 unknown type/icon subtype (forward compat)
 *   - title 없는 header
 *   - image 없는 full_image/weather, 빈 items thumbnail/icon
 *   - 아이템 link는 url만 도메인 링크로, 그 외/빈 value는 null
 * 아이템의 raw analytics/method/promo, header bgColor 등 표시 무관 필드는 반영하지 않는다.
 */
export function normalizeTodayPosts(raw: RawTodayPost[]): TodayPost[] {
  const posts: TodayPost[] = [];
  for (const p of raw) {
    if (p.id === undefined) continue;
    const header = normalizeHeader(p.header);
    if (!header) continue; // header(title) 없으면만 드롭. 컨텐츠는 옵션.
    const base = { id: p.id, header, isDark: p.isDark ?? false };
    const items = p.body?.items;

    if (p.type === 'full_image') {
      // 이미지 없으면 item=null(헤더 전용). 드롭하지 않음.
      posts.push({ ...base, type: 'full_image', item: normalizeFullImage(items) });
    } else if (p.type === 'thumbnail') {
      // 아이템 없어도 헤더만으로 렌더(빈 리스트 허용).
      posts.push({ ...base, type: 'thumbnail', items: normalizeThumbnailItems(items) });
    } else if (p.type === 'icon' && p.subtype === 'daily') {
      posts.push({ ...base, type: 'icon', items: normalizeIconItems(items) });
    } else if (p.type === 'icon' && p.subtype === 'daily_weather') {
      posts.push({ ...base, type: 'weather', item: normalizeWeather(items) });
    } else if (p.type === 'gift') {
      const giftItems = normalizeGiftItems(p.body?.items as unknown as RawGiftItem[] | undefined);
      if (giftItems.length === 0) continue;
      posts.push({ ...base, type: 'gift', items: giftItems });
    } else if (p.type === 'chat') {
      const groups = p.body?.items as unknown as RawChatEl[][] | undefined;
      const picker = normalizeChatPicker(groups?.[1]);
      if (!picker) continue; // 피커 없으면 상호작용 불가 → 드롭
      posts.push({
        ...base,
        type: 'chat',
        bgColor: emptyToNull(p.body?.bgColor),
        messages: normalizeChatMessages(groups?.[0]),
        picker,
      });
    }
    // 그 외(unknown type, unknown icon subtype) → drop
  }
  return posts;
}

/** 단일 raw 포스트 → 도메인(액션 후 getPost 재조회용). 지원 안 되면 null. */
export function normalizeTodayPost(raw: RawTodayPost): TodayPost | null {
  return normalizeTodayPosts([raw])[0] ?? null;
}
