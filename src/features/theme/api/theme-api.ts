import { http, type HttpClient } from '@/shared/lib';
import type { ThemeWidget } from '../types/theme-types';
import {
  normalizeThemeWidgets,
  type RawThemeListResponse,
} from './normalize-theme-widgets';

export function createThemeApi(client: HttpClient) {
  return {
    /** GET /api/theme/list/{code} — 홈 등에 꽂는 위젯 목록 (위젯 컨텍스트) */
    listByCode: async (code: string): Promise<ThemeWidget[]> => {
      const res = await client.get<RawThemeListResponse>(`/api/theme/list/${code}`);
      return normalizeThemeWidgets(res.data);
    },
    // 후속: getById(id) → GET /api/theme/{id} (페이지 컨텍스트, 어휘 예약: Theme/ThemePage)
  };
}

export const themeApi = createThemeApi(http);
