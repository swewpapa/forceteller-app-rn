import { http, type HttpClient } from '@/shared/lib';
import type { MoreShortcut } from '@/features/more/types/more-types';
import { normalizeMoreList, type MoreListResponse } from './normalize-more';

export function createMoreApi(client: HttpClient) {
  return {
    /** GET /api/more/list — 더보기 숏컷 목록(서버 드리븐, 공개). */
    list: async (): Promise<MoreShortcut[]> => {
      const res = await client.get<MoreListResponse>('/api/more/list');
      return normalizeMoreList(res.data);
    },
  };
}

export const moreApi = createMoreApi(http);
