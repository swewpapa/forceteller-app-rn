import { createTodayApi } from '../api/today-api';
import type { HttpClient } from '@/shared/lib';

describe('today-api', () => {
  it('listPosts: 고정 경로 호출 + 봉투 언랩 + 정규화', async () => {
    const get = jest.fn().mockResolvedValue({
      status: 200,
      data: [
        {
          id: 1,
          type: 'full_image',
          subtype: 'item',
          header: { title: '슬롯머신 돌려야죠', subtitle: '포스가 부족한가요?' },
          body: {
            items: [
              {
                image: 'https://static.forceteller.com/x/full.jpg',
                link: { type: 'url', value: 'https://event.forceteller.com/slot' },
              },
            ],
          },
          isDark: false,
        },
        // gift는 Phase1 미지원 → normalize가 드롭. 봉투 언랩+필터 확인용.
        {
          id: 6542,
          type: 'gift',
          subtype: 'multi_gift',
          header: { title: '다중 선물형 테스트', subtitle: '로즈 테스트' },
          body: { items: [] },
          isDark: false,
        },
      ],
    });
    const todayApi = createTodayApi({ get } as unknown as HttpClient);

    const posts = await todayApi.listPosts();

    expect(get).toHaveBeenCalledWith('/api/today/posts');
    expect(posts).toHaveLength(1);
    expect(posts[0]).toMatchObject({ id: 1, type: 'full_image' });
  });
});
