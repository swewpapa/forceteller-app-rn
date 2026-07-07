import { http, type HttpClient } from '@/shared/lib';
import type { Theme } from '../types/theme-types';
import {
  normalizeThemes,
  type RawThemeListResponse,
} from './normalize-themes';

export function createThemeApi(client: HttpClient) {
  return {
    /** GET /api/theme/list/{code} — 홈 등에 꽂는 위젯 목록 (위젯 컨텍스트) */
    listByCode: async (code: string): Promise<Theme[]> => {
      const res = await client.get<RawThemeListResponse>(`/api/theme/list/${code}`);
      return normalizeThemes(res.data);
    },
    // 후속: getById(id) → GET /api/theme/{id} (페이지 컨텍스트, 같은 Theme 엔티티, 컨텍스트 구분은 훅 이름이 한다)
  };
}

export const themeApi = createThemeApi(http);
