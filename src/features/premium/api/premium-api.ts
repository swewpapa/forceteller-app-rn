import { http, type HttpClient } from '@/shared/lib';
import type { Premium, PremiumSubjects } from '../types/premium-types';
import { normalizePremiumList, type PremiumListResponse } from './normalize-premium';
import {
  normalizePremiumSubjects,
  type PremiumSubjectsResponse,
} from './normalize-premium-subjects';

export function createPremiumApi(client: HttpClient) {
  return {
    /** GET /api/premium/list/v2 — 프리미엄 홈 서버드리븐 위젯 목록 (인증 불필요) */
    listV2: async (): Promise<Premium[]> => {
      const res = await client.get<PremiumListResponse>('/api/premium/list/v2');
      return normalizePremiumList(res.data);
    },

    /** GET /api/premium/subjects — 카테고리(장르/주제). */
    getSubjects: async (): Promise<PremiumSubjects> => {
      const res = await client.get<PremiumSubjectsResponse>('/api/premium/subjects');
      return normalizePremiumSubjects(res.data);
    },
  };
}

export const premiumApi = createPremiumApi(http);
