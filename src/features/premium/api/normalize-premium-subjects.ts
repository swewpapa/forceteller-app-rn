import type {
  PremiumSubjectItem,
  PremiumSubjectLink,
  PremiumSubjects,
} from '@/features/premium/types/premium-types';

// ─── raw 타입: 서버 응답 그대로. api/ 내부 전용 ───

type RawSubjectLink = {
  type?: string;
  value?: string;
  params?: Record<string, unknown>;
};

type RawSubjectItem = {
  name?: string;
  status?: string; // 노출 상태(예 'S3') — 도메인 미반영
  icon?: string; // genre만 존재(원격 PNG)
  link?: RawSubjectLink;
  tag?: string; // 옵션 배지("new!!!")
};

export type PremiumSubjectsResponse = {
  status: number;
  data: { genres?: RawSubjectItem[]; keywords?: RawSubjectItem[] };
};

// ─── 정규화 ───

// url 링크만. value 없거나 미지 type이면 null. params(queryParams)는 원형 보존.
function normalizeSubjectLink(link: RawSubjectLink | undefined): PremiumSubjectLink | null {
  if (!link || !link.value || link.type !== 'url') return null;
  return link.params
    ? { type: 'url', value: link.value, params: link.params }
    : { type: 'url', value: link.value };
}

function normalizeSubjectItems(raw: RawSubjectItem[] | undefined): PremiumSubjectItem[] {
  const items: PremiumSubjectItem[] = [];
  for (const it of raw ?? []) {
    if (!it.name) continue; // 이름 없으면 렌더 불가 → 드롭
    items.push({
      name: it.name,
      iconUrl: it.icon || null,
      link: normalizeSubjectLink(it.link),
      tag: it.tag || null,
    });
  }
  return items;
}

/** raw 카테고리 → 도메인 PremiumSubjects. name 없는 항목만 드롭. */
export function normalizePremiumSubjects(raw: PremiumSubjectsResponse['data']): PremiumSubjects {
  return {
    genres: normalizeSubjectItems(raw.genres),
    keywords: normalizeSubjectItems(raw.keywords),
  };
}
