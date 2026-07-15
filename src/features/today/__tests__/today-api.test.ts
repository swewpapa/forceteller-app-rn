import { createTodayApi } from '@/features/today/api/today-api';
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

  it('getPost: GET /api/today/post/{id} + 봉투 언랩 + 단일 정규화', async () => {
    const get = jest.fn().mockResolvedValue({
      status: 200,
      data: {
        id: 8,
        type: 'full_image',
        subtype: 'item',
        header: { title: 't' },
        body: { items: [{ image: 'https://x/a.jpg', link: { type: 'url', value: '/a' } }] },
        isDark: false,
      },
    });
    const todayApi = createTodayApi({ get } as unknown as HttpClient);

    const post = await todayApi.getPost(8);

    expect(get).toHaveBeenCalledWith('/api/today/post/8');
    expect(post).toMatchObject({ id: 8, type: 'full_image' });
  });

  it('getPost: 지원 안 되는 포스트면 null', async () => {
    const get = jest.fn().mockResolvedValue({
      status: 200,
      data: { id: 9, type: 'unknownX', header: { title: 't' }, body: {}, isDark: false },
    });
    const todayApi = createTodayApi({ get } as unknown as HttpClient);

    expect(await todayApi.getPost(9)).toBeNull();
  });

  it('runAction: POST 액션 → client.post(endpoint, payload) body', async () => {
    const post = jest.fn().mockResolvedValue(undefined);
    const todayApi = createTodayApi({ post } as unknown as HttpClient);

    await todayApi.runAction(
      { type: 'api', endpoint: '/api/daily/calc/d_tarot', method: 'POST' },
      { selectedIndex: 3 },
    );

    expect(post).toHaveBeenCalledWith('/api/daily/calc/d_tarot', { selectedIndex: 3 });
  });

  it('runAction: GET 액션 → payload를 query로', async () => {
    const get = jest.fn().mockResolvedValue(undefined);
    const todayApi = createTodayApi({ get } as unknown as HttpClient);

    await todayApi.runAction(
      { type: 'api', endpoint: '/api/x', method: 'GET' },
      { selectedIndex: 2 },
    );

    expect(get).toHaveBeenCalledWith('/api/x?selectedIndex=2');
  });
});
