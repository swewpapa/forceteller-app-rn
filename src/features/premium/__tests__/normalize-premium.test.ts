import { normalizePremiumList } from '@/features/premium/api/normalize-premium';

// dev 실응답(premium-list.json {status, data:[]})에서 각 type 대표 1개 + 엣지를 발췌한 픽스처.
// 위젯 subtitle은 top-level이 아니라 extra.subTitle에서 온다(실측).

const rawRank = {
  id: 35,
  title: '실시간 HOT',
  status: 'S3',
  extra: { subTitle: '', listType: 'thumbnail' },
  type: 'rank',
  items: [
    {
      id: 1446,
      title: '이성의 눈에 비친 나의 매력',
      subtitle: '타로 마스터 묘묘타로',
      price: 800,
      type: 'web',
      status: 'S3',
      thumbnailImage: 'https://static.example.com/a.webp',
      link: { type: 'url', value: '/premium/1446' },
    },
  ],
};

const rawGeneral = {
  id: 161,
  title: '인기 운세 모음집',
  status: 'S3',
  extra: { subTitle: '쏟아지는 하트!', listType: 'thumbnail' },
  type: 'general',
  items: [
    {
      id: 885,
      title: '육상으로 보는 운명의 상대',
      subtitle: '육상음양술',
      price: 1000,
      type: 'web',
      status: 'S3',
      thumbnailImage: 'https://static.example.com/b.jpg',
      link: { type: 'url', value: '/premium/885' },
    },
  ],
  // 위젯 레벨 "모두 보기" 링크 — 도메인 Premium.general엔 없어 드롭됨.
  link: { type: 'url', value: '/premium/theme/161', title: '모두 보기' },
};

const rawBanner = {
  id: 175,
  title: '포덕레벨 (공통노출)',
  status: 'S3',
  extra: {
    subTitle: '',
    listType: 'thumbnail',
    bannerBgColor: '#ffffff',
    bannerImage: 'https://static.example.com/banner.png',
  },
  type: 'banner',
  // 배너 탭 타깃 링크 — 도메인 Premium.banner엔 없어 드롭됨.
  link: { type: 'url', value: 'https://event.example.com/level' },
};

const rawCarousel = {
  id: 32,
  title: '테마별로 즐겨요',
  status: 'S3',
  extra: {
    subTitle: '',
    listType: 'thumbnail',
    thumbnailHeight: '200', // 문자열 px
    thumbnailWidth: '180',
  },
  type: 'carousel',
  items: [
    {
      id: 270,
      title: '', // carousel 아이템은 title이 빈 경우 존재
      subtitle: '',
      type: 'general',
      status: 'S3',
      thumbnailImage: 'https://static.example.com/c.webp',
      link: { type: 'url', value: '/premium/theme/270' },
    },
  ],
};

const rawButton = {
  id: 39,
  title: '타로 상담소',
  status: 'S3',
  extra: { subTitle: '마담 그리샴의', listType: 'thumbnail' },
  type: 'button',
  items: [
    {
      id: 57,
      title: '[BUTTON] 마담 그리샴의 YES or NO',
      subtitle: '지금 간절히 원한다면',
      type: 'general',
      status: 'S3',
      thumbnailImage: 'https://static.example.com/d.webp',
      link: { type: 'url', value: '/premium/theme/57' },
    },
  ],
};

const rawTag = {
  id: 33,
  title: '주제별 운세',
  status: 'S3',
  extra: { subTitle: '', listType: 'thumbnail' },
  type: 'tag',
  tags: [
    {
      text: '전체',
      link: {
        type: 'api',
        value: '/api/premium/fetch',
        params: { queryParams: { keyword: 'all' } },
      },
    },
    {
      text: '신년운세',
      link: {
        type: 'api',
        value: '/api/premium/fetch',
        params: { queryParams: { keyword: '신년운세' } },
      },
    },
  ],
};

describe('normalizePremiumList', () => {
  // ─── type별 대표 매핑 ───

  it('rank 위젯을 items와 함께 매핑하고 url 링크를 보존한다', () => {
    const [w] = normalizePremiumList([rawRank]);
    expect(w).toMatchObject({
      id: 35,
      type: 'rank',
      title: '실시간 HOT',
      subtitle: null, // extra.subTitle: '' → null
    });
    if (w.type !== 'rank') throw new Error('unreachable');
    expect(w.moreLink).toBeNull(); // 위젯 레벨 link 없음 → null
    expect(w.items).toHaveLength(1);
    expect(w.items[0]).toEqual({
      id: 1446,
      title: '이성의 눈에 비친 나의 매력',
      subtitle: '타로 마스터 묘묘타로',
      thumbnailImage: 'https://static.example.com/a.webp',
      price: 800,
      link: { type: 'url', value: '/premium/1446' },
    });
  });

  it('general 위젯 subtitle은 extra.subTitle에서 오고 price(number)를 보존한다', () => {
    const [w] = normalizePremiumList([rawGeneral]);
    expect(w.subtitle).toBe('쏟아지는 하트!');
    if (w.type !== 'general') throw new Error('unreachable');
    expect(w.items[0].price).toBe(1000);
    // 위젯 레벨 "모두 보기" 링크 → moreLink(title은 도메인 PremiumLink에 없어 드롭).
    expect(w.moreLink).toEqual({ type: 'url', value: '/premium/theme/161' });
  });

  it('carousel: 문자열 px thumbnail을 number로 변환하고, price 없는 아이템은 null', () => {
    const [w] = normalizePremiumList([rawCarousel]);
    if (w.type !== 'carousel') throw new Error('unreachable');
    expect(w.moreLink).toBeNull(); // 위젯 레벨 link 없음 → null
    expect(w.thumbnail).toEqual({ width: 180, height: 200 });
    expect(w.items[0].price).toBeNull(); // carousel 아이템엔 price 필드 없음
    expect(w.items[0].title).toBe(''); // 빈 title은 드롭하지 않고 '' 유지
    expect(w.items[0].subtitle).toBeNull(); // '' → null
  });

  it('button 위젯도 items로 매핑하고 price는 null', () => {
    const [w] = normalizePremiumList([rawButton]);
    expect(w).toMatchObject({ id: 39, type: 'button', subtitle: '마담 그리샴의' });
    if (w.type !== 'button') throw new Error('unreachable');
    expect(w.moreLink).toBeNull(); // 위젯 레벨 link 없음 → null
    expect(w.items[0].price).toBeNull();
  });

  it('banner: extra.bannerImage→image, bannerBgColor→bgColor, top-level link→탭 타깃', () => {
    const [w] = normalizePremiumList([rawBanner]);
    expect(w).toEqual({
      id: 175,
      title: '포덕레벨 (공통노출)',
      subtitle: null,
      type: 'banner',
      image: 'https://static.example.com/banner.png',
      bgColor: '#ffffff',
      link: { type: 'url', value: 'https://event.example.com/level' },
    });
  });

  it('tag 위젯: tags[]를 매핑하고 api 링크의 params.queryParams.keyword를 평탄화한다', () => {
    const [w] = normalizePremiumList([rawTag]);
    if (w.type !== 'tag') throw new Error('unreachable');
    expect(w.tags).toEqual([
      { text: '전체', link: { type: 'api', value: '/api/premium/fetch', keyword: 'all' } },
      {
        text: '신년운세',
        link: { type: 'api', value: '/api/premium/fetch', keyword: '신년운세' },
      },
    ]);
  });

  it('6개 type을 한 번에 정규화한다', () => {
    const result = normalizePremiumList([
      rawRank,
      rawGeneral,
      rawBanner,
      rawCarousel,
      rawButton,
      rawTag,
    ]);
    expect(result.map((w) => w.type)).toEqual([
      'rank',
      'general',
      'banner',
      'carousel',
      'button',
      'tag',
    ]);
  });

  // ─── 드롭 정책 (렌더 불가만 드롭, forward-compat) ───

  it('unknown type 위젯은 드롭한다 (forward compat)', () => {
    expect(normalizePremiumList([{ ...rawRank, type: 'hologram_banner' }])).toEqual([]);
  });

  it('link 없는 아이템은 드롭하고, 유효 아이템 0이면 위젯도 드롭한다', () => {
    const noLink = { ...rawRank, items: [{ id: 1, title: 'x', price: 100 }] };
    expect(normalizePremiumList([noLink])).toEqual([]);
  });

  it('items가 없거나 빈 rank/general/carousel/button 위젯은 드롭한다', () => {
    expect(
      normalizePremiumList([
        { ...rawRank, items: [] },
        { ...rawGeneral, items: undefined },
        { ...rawCarousel, items: [] },
        { ...rawButton, items: [] },
      ]),
    ).toEqual([]);
  });

  it('image 없는 banner는 드롭한다', () => {
    const noImage = { ...rawBanner, extra: { subTitle: '', bannerBgColor: '#fff' } };
    expect(normalizePremiumList([noImage])).toEqual([]);
  });

  it('치수가 빈 문자열/0/음수인 carousel은 드롭한다 (파싱 불가 → NaN/0 렌더 방지)', () => {
    const emptyW = { ...rawCarousel, extra: { ...rawCarousel.extra, thumbnailWidth: '' } };
    const zeroH = { ...rawCarousel, extra: { ...rawCarousel.extra, thumbnailHeight: '0' } };
    const negW = { ...rawCarousel, extra: { ...rawCarousel.extra, thumbnailWidth: '-10' } };
    expect(normalizePremiumList([emptyW, zeroH, negW])).toEqual([]);
  });

  it('link 없는 banner는 드롭한다 (배너는 탭 타깃이 존재 이유)', () => {
    const noLink = {
      id: 175,
      title: '포덕레벨 (공통노출)',
      status: 'S3',
      extra: {
        subTitle: '',
        bannerBgColor: '#ffffff',
        bannerImage: 'https://static.example.com/banner.png',
      },
      type: 'banner',
      // top-level link 없음
    };
    expect(normalizePremiumList([noLink])).toEqual([]);
  });

  it('tags가 전부 유효하지 않으면(text/link 결손) tag 위젯을 드롭한다', () => {
    const badTags = {
      ...rawTag,
      tags: [
        { text: '링크없음' }, // link 없음
        {
          link: {
            type: 'api',
            value: '/x',
            params: { queryParams: { keyword: 'k' } },
          },
        }, // text 없음
      ],
    };
    expect(normalizePremiumList([badTags])).toEqual([]);
  });

  it('빈 문자열 subtitle/thumbnailImage는 null로 정규화한다', () => {
    const [w] = normalizePremiumList([
      {
        ...rawRank,
        items: [
          {
            id: 1,
            title: 't',
            subtitle: '',
            thumbnailImage: '',
            price: 100,
            link: { type: 'url', value: '/x' },
          },
        ],
      },
    ]);
    if (w.type !== 'rank') throw new Error('unreachable');
    expect(w.items[0].subtitle).toBeNull();
    expect(w.items[0].thumbnailImage).toBeNull();
  });

  it('unknown link type인 아이템은 드롭한다', () => {
    const badLink = {
      ...rawRank,
      items: [{ id: 1, title: 'a', price: 100, link: { type: 'deeplink', value: 'x://y' } }],
    };
    expect(normalizePremiumList([badLink])).toEqual([]);
  });
});
