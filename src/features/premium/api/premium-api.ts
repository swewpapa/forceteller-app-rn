import { http, type HttpClient } from '@/shared/lib';
import type { Premium } from '../types/premium-types';
import {
  normalizePremiumList,
  type RawPremiumListResponse,
} from './normalize-premium';

export function createPremiumApi(client: HttpClient) {
  return {
    /** GET /api/premium/list/v2 — 프리미엄 홈 서버드리븐 위젯 목록 (인증 불필요) */
    listV2: async (): Promise<Premium[]> => {
      const res = await client.get<RawPremiumListResponse>('/api/premium/list/v2');
      return normalizePremiumList(res.data);
    },
  };
}

export const premiumApi = createPremiumApi(http);
