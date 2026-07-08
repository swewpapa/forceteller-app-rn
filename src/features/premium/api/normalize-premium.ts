import type {
  Premium,
  PremiumItem,
  PremiumLink,
  PremiumTag,
} from '../types/premium-types';

// ─── raw 타입: 서버 응답 그대로. api/ 내부 전용 — feature 배럴로 반출 금지 ───

export type RawPremiumLink = {
  type?: string;
  value?: string;
  title?: string; // "모두 보기" 등 라벨. 도메인 PremiumLink는 type/value만 — title 미반영.
  params?: { queryParams?: Record<string, string> };
};

export type RawPremiumItem = {
  id?: number;
  title?: string;
  subtitle?: string | null;
  price?: number;
  type?: string; // 아이템 raw type/status는 UI 무관 — 도메인 미반영.
  status?: string;
  thumbnailImage?: string;
  link?: RawPremiumLink;
};

export type RawPremiumTag = {
  text?: string;
  link?: RawPremiumLink;
};

export type RawPremium = {
  id?: number;
  title?: string;
  status?: string;
  type?: string;
  extra?: {
    subTitle?: string; // 위젯 subtitle (top-level 아님)
    listType?: string;
    bannerImage?: string; // banner
    bannerBgColor?: string; // banner
    thumbnailWidth?: string; // carousel (문자열 px)
    thumbnailHeight?: string; // carousel (문자열 px)
  };
  items?: RawPremiumItem[]; // rank/general/carousel/button
  tags?: RawPremiumTag[]; // tag
  link?: RawPremiumLink; // items 위젯→moreLink(헤더 "모두 보기"), banner→link(탭 타깃)
};

export type RawPremiumListResponse = { status: number; data: RawPremium[] };

// ─── 정규화 ───

// items 배열을 갖는 단순 위젯(carousel은 thumbnail이 추가로 필요해 별도 분기).
const ITEM_LIST_TYPES = ['rank', 'general', 'button'] as const;
type ItemListType = (typeof ITEM_LIST_TYPES)[number];

function isItemListType(type: string): type is ItemListType {
  return (ITEM_LIST_TYPES as readonly string[]).includes(type);
}

function emptyToNull(value: string | null | undefined): string | null {
  return value ? value : null;
}

// carousel 치수(thumbnailWidth/Height) 파서. 치수는 양수여야 유효 —
// 빈 문자열('')은 Number('')===0이라 통과하면 ratio=NaN·width=0으로 깨지므로 0/음수/파싱불가는 null.
function toFiniteNumber(value: string | undefined): number | null {
  if (!value) return null; // undefined/빈 문자열
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function normalizeLink(link: RawPremiumLink | undefined): PremiumLink | null {
  if (!link?.type || !link.value) return null;
  if (link.type === 'url') return { type: 'url', value: link.value };
  if (link.type === 'api') {
    const keyword = link.params?.queryParams?.keyword;
    if (!keyword) return null; // keyword 없는 api 링크는 도메인 구성 불가
    return { type: 'api', value: link.value, keyword };
  }
  return null; // unknown link type → 호출부에서 항목 드롭
}

function normalizeItem(item: RawPremiumItem): PremiumItem | null {
  const link = normalizeLink(item.link);
  if (!link) return null;
  if (item.id === undefined) return null; // id는 도메인 필수(리스트 key)
  return {
    id: item.id,
    title: item.title ?? '', // 빈 title은 유효(carousel 썸네일), 결손 시 ''
    subtitle: emptyToNull(item.subtitle),
    thumbnailImage: emptyToNull(item.thumbnailImage),
    price: item.price ?? null, // general/rank만 존재
    link,
  };
}

function normalizeItems(items: RawPremiumItem[] | undefined): PremiumItem[] {
  return (items ?? [])
    .map(normalizeItem)
    .filter((i): i is PremiumItem => i !== null);
}

function normalizeTag(tag: RawPremiumTag): PremiumTag | null {
  const link = normalizeLink(tag.link);
  if (!link || !tag.text) return null;
  return { text: tag.text, link };
}

/**
 * raw 프리미엄 위젯 목록 → 도메인 Premium[].
 * 렌더 불가능한 단위는 이 경계에서 드롭한다:
 *   - unknown type(forward compat)
 *   - link 없는(또는 unknown link type) 아이템/태그, 결과 비면 위젯도 드롭
 *   - 빈 items(rank/general/carousel/button) / 빈 tags(tag)
 *   - image/bgColor/link 없는 banner, thumbnail 치수 파싱 불가한 carousel
 * 위젯 레벨 link는 banner→link(탭 타깃, 필수), items 위젯→moreLink(헤더 "모두 보기", nullable).
 * 아이템의 raw type/status는 도메인 무관이라 반영하지 않는다.
 */
export function normalizePremiumList(raw: RawPremium[]): Premium[] {
  const premiums: Premium[] = [];
  for (const w of raw) {
    if (w.id === undefined || !w.title || !w.type) continue;
    const base = {
      id: w.id,
      title: w.title,
      subtitle: emptyToNull(w.extra?.subTitle),
    };

    if (w.type === 'banner') {
      const image = emptyToNull(w.extra?.bannerImage);
      const bgColor = emptyToNull(w.extra?.bannerBgColor);
      if (!image || !bgColor) continue; // image가 1차 드롭 사유(스펙), bgColor는 도메인 필수
      const link = normalizeLink(w.link);
      if (!link) continue; // 배너는 탭 타깃(link)이 존재 이유 — 없으면 렌더 의미 없음
      premiums.push({ ...base, type: 'banner', image, bgColor, link });
    } else if (w.type === 'tag') {
      const tags = (w.tags ?? [])
        .map(normalizeTag)
        .filter((t): t is PremiumTag => t !== null);
      if (tags.length === 0) continue;
      premiums.push({ ...base, type: 'tag', tags });
    } else if (w.type === 'carousel') {
      const items = normalizeItems(w.items);
      if (items.length === 0) continue;
      const width = toFiniteNumber(w.extra?.thumbnailWidth);
      const height = toFiniteNumber(w.extra?.thumbnailHeight);
      if (width === null || height === null) continue; // 치수 없으면 렌더 불가
      premiums.push({
        ...base,
        type: 'carousel',
        items,
        thumbnail: { width, height },
        moreLink: normalizeLink(w.link),
      });
    } else if (isItemListType(w.type)) {
      // rank / general / button — 동일 shape(items + 헤더 moreLink)
      const items = normalizeItems(w.items);
      if (items.length === 0) continue;
      premiums.push({ ...base, type: w.type, items, moreLink: normalizeLink(w.link) });
    }
    // unknown type → drop
  }
  return premiums;
}
