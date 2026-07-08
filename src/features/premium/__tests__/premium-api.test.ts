import { createPremiumApi } from '../api/premium-api';
import type { HttpClient } from '@/shared/lib';

describe('premium-api', () => {
  it('listV2: 고정 경로 호출 + 봉투 언랩 + 정규화', async () => {
    const get = jest.fn().mockResolvedValue({
      status: 200,
      data: [
        {
          id: 35,
          title: '실시간 HOT',
          type: 'rank',
          items: [
            {
              id: 1446,
              title: '이성의 눈에 비친 나의 매력',
              price: 800,
              link: { type: 'url', value: '/premium/1446' },
            },
          ],
        },
        { id: 99, title: 'x', type: 'hologram_banner', items: [] },
      ],
    });
    const premiumApi = createPremiumApi({ get } as unknown as HttpClient);

    const widgets = await premiumApi.listV2();

    expect(get).toHaveBeenCalledWith('/api/premium/list/v2');
    expect(widgets).toHaveLength(1);
    expect(widgets[0]).toMatchObject({ type: 'rank', title: '실시간 HOT' });
  });
});
