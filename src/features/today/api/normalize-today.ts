import type {
  FullImageItem,
  IconItem,
  ThumbnailItem,
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

// ─── 정규화 ───

function emptyToNull(value: string | null | undefined): string | null {
  return value ? value : null;
}

// Phase1 표시형 링크는 url만. api 등 다른 type이거나 value가 비면 null(→ 호출부에서 link 없음 처리).
function normalizeLink(link: RawTodayLink | undefined): TodayLink | null {
  if (!link || link.type !== 'url' || !link.value) return null;
  return link.params
    ? { type: 'url', value: link.value, params: link.params }
    : { type: 'url', value: link.value };
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
    if (!header) continue;
    const base = { id: p.id, header, isDark: p.isDark ?? false };
    const items = p.body?.items;

    if (p.type === 'full_image') {
      const item = normalizeFullImage(items);
      if (!item) continue;
      posts.push({ ...base, type: 'full_image', item });
    } else if (p.type === 'thumbnail') {
      const mapped = normalizeThumbnailItems(items);
      if (mapped.length === 0) continue;
      posts.push({ ...base, type: 'thumbnail', items: mapped });
    } else if (p.type === 'icon' && p.subtype === 'daily') {
      const mapped = normalizeIconItems(items);
      if (mapped.length === 0) continue;
      posts.push({ ...base, type: 'icon', items: mapped });
    } else if (p.type === 'icon' && p.subtype === 'daily_weather') {
      const item = normalizeWeather(items);
      if (!item) continue;
      posts.push({ ...base, type: 'weather', item });
    }
    // 그 외(gift/chat/unknown type, unknown icon subtype) → drop
  }
  return posts;
}
