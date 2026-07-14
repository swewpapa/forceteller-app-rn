import type { MoreShortcut, MoreShortcutLink } from '@/features/more/types/more-types';

// ─── raw 타입: 서버 응답 그대로. api/ 내부 전용 — feature 배럴/도메인 밖 반출 금지 ───

type RawMoreLink = {
  type?: string;
  value?: string;
};

type RawMoreItem = {
  id?: number;
  name?: string;
  link?: RawMoreLink;
  icon?: string;
  code?: string; // 시맨틱 코드(대개 빈 문자열) — 도메인 미반영
  priority?: number;
  status?: string; // 노출 상태(예: 'S3') — 도메인 미반영
};

export type MoreListResponse = { status: number; data: RawMoreItem[] };

// ─── 정규화 ───

// url 링크만 도메인으로. value 없거나 미지 type이면 null(현재 서버는 전부 url).
function normalizeLink(link: RawMoreLink | undefined): MoreShortcutLink | null {
  if (!link || !link.value) return null;
  if (link.type === 'url') return { type: 'url', value: link.value };
  return null;
}

/**
 * raw 더보기 목록 → 도메인 MoreShortcut[]. priority 오름차순 정렬.
 * 렌더 불가능한 항목은 이 경계에서 드롭한다:
 *   - id/name 없음
 *   - icon(원격 SVG URL) 없음 — 아이콘 없이 렌더 불가
 *   - link가 url이 아니거나 value 없음 — 목적지 불명
 * raw code/status는 표시 무관이라 반영하지 않는다.
 */
export function normalizeMoreList(raw: RawMoreItem[]): MoreShortcut[] {
  const items: MoreShortcut[] = [];
  for (const it of raw) {
    if (it.id === undefined) continue;
    if (!it.name) continue;
    if (!it.icon) continue;
    const link = normalizeLink(it.link);
    if (!link) continue;
    items.push({
      id: it.id,
      name: it.name,
      iconUrl: it.icon,
      link,
      priority: it.priority ?? 0,
    });
  }
  items.sort((a, b) => a.priority - b.priority);
  return items;
}
