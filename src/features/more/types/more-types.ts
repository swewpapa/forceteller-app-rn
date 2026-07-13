/** 더보기 숏컷 링크. 현재 서버는 전부 type='url'(내부 SPA path 또는 외부 절대 URL). */
export type MoreShortcutLink = { type: 'url'; value: string };

/**
 * 더보기 숏컷(서버 드리븐, GET /api/more/list).
 * iconUrl은 원격 SVG. priority 오름차순이 표시 순서.
 */
export type MoreShortcut = {
  id: number;
  name: string;
  iconUrl: string;
  link: MoreShortcutLink;
  priority: number;
};
