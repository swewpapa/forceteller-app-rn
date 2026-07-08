import { http, type HttpClient } from '@/shared/lib';
import type { TodayPost } from '../types/today-types';
import { normalizeTodayPosts, type RawTodayResponse } from './normalize-today';

export function createTodayApi(client: HttpClient) {
  return {
    /** GET /api/today/posts — today 탭 서버드리븐 포스트 피드 */
    listPosts: async (): Promise<TodayPost[]> => {
      const res = await client.get<RawTodayResponse>('/api/today/posts');
      return normalizeTodayPosts(res.data);
    },
  };
}

export const todayApi = createTodayApi(http);
