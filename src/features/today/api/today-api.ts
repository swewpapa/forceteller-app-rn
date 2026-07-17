import { http, type HttpClient } from '@/shared/lib';
import type { TodayApiLink, TodayHero, TodayPost } from '../types/today-types';
import {
  normalizeTodayHero,
  normalizeTodayPost,
  normalizeTodayPosts,
  type TodayHeroResponse,
  type TodayPostResponse,
  type TodayResponse,
} from './normalize-today';

export function createTodayApi(client: HttpClient) {
  return {
    /** GET /api/today/posts — today 탭 서버드리븐 포스트 피드 */
    listPosts: async (): Promise<TodayPost[]> => {
      const res = await client.get<TodayResponse>('/api/today/posts');
      return normalizeTodayPosts(res.data);
    },

    /** GET /api/today/hero — 투데이 상단 히어로(날짜·헤드라인·bg·동물). 없으면 null. */
    getHero: async (): Promise<TodayHero | null> => {
      const res = await client.get<TodayHeroResponse>('/api/today/hero');
      return normalizeTodayHero(res.data);
    },

    /** GET /api/today/post/{id} — 단일 포스트 재조회(액션 후 갱신 상태 획득용). */
    getPost: async (id: number): Promise<TodayPost | null> => {
      const res = await client.get<TodayPostResponse>(`/api/today/post/${id}`);
      return normalizeTodayPost(res.data);
    },

    /**
     * 아이템/버튼의 api 링크 실행(gift 클레임·chat 선택 등). method에 맞는 HTTP 메서드로 endpoint 호출.
     * 응답 본문은 쓰지 않고, 호출부가 getPost로 갱신 상태를 다시 받는다(Martin 확정 플로우).
     */
    runAction: async (action: TodayApiLink, payload?: Record<string, unknown>): Promise<void> => {
      switch (action.method.toUpperCase()) {
        case 'GET': {
          // GET은 payload를 쿼리로, POST/PUT/PATCH는 body로.
          const qs = payload
            ? '?' +
              Object.entries(payload)
                .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
                .join('&')
            : '';
          await client.get(action.endpoint + qs);
          break;
        }
        case 'PUT':
          await client.put(action.endpoint, payload);
          break;
        case 'PATCH':
          await client.patch(action.endpoint, payload);
          break;
        case 'DELETE':
          await client.delete(action.endpoint);
          break;
        default: // POST 및 기타 — body에 payload(예: { selectedIndex })
          await client.post(action.endpoint, payload);
      }
    },
  };
}

export const todayApi = createTodayApi(http);
