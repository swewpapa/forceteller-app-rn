import { http, type HttpClient } from '@/shared/lib';
import type { TodayFortune } from '../types/today-types';

export function createTodayApi(client: HttpClient) {
  return {
    /** ⚠️ 스켈레톤: 경로(/api prefix 여부)·응답 형태는 서버 스펙 미확정 — 실연동 시 확정 */
    getBySign: (sign: string): Promise<TodayFortune> =>
      client.get<TodayFortune>(`/today/${sign}`),
  };
}

export const todayApi = createTodayApi(http);
