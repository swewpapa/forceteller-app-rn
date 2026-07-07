import { createThemeApi } from '../api/theme-api';
import type { HttpClient } from '@/shared/lib';

describe('theme-api', () => {
  it('listByCode: 경로 조립 + 봉투 언랩 + 정규화', async () => {
    const get = jest.fn().mockResolvedValue({
      status: 200,
      data: [
        {
          id: 41, uuid: 'u41', type: 'text_only', title: '실시간 인기 급상승', subtitle: '지금 대세',
          themeViews: [
            { id: 1, viewId: 10, title: '연애로 본 내 숨겨진 욕망', link: { type: 'url', value: '/item/1' } },
          ],
        },
        { id: 99, uuid: 'u99', type: 'unknown_widget', title: 'x', themeViews: [] },
      ],
    });
    const themeApi = createThemeApi({ get } as unknown as HttpClient);

    const widgets = await themeApi.listByCode('recommend_top');

    expect(get).toHaveBeenCalledWith('/api/theme/list/recommend_top');
    expect(widgets).toHaveLength(1);
    expect(widgets[0]).toMatchObject({ type: 'text_only', title: '실시간 인기 급상승' });
  });
});
