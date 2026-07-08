import { normalizeTodayPosts } from '../api/normalize-today';

// dev 실응답(today-posts-member.json {status, data:[]})에서 각 지원 타입 대표 + 엣지를 발췌한 픽스처.
// weather의 temp는 raw item.title("25º 비")에서 온다(실측). link의 analytics/method는 도메인 미반영.

// full_image (id 1) — link value 존재.
const rawFullImage = {
  id: 1,
  type: 'full_image',
  subtype: 'item',
  status: 'S3',
  header: { title: '슬롯머신 돌려야죠', subtitle: '이승환_Martin2님, 포스가 부족한가요?' },
  body: {
    items: [
      {
        image:
          'https://static.forceteller.com/9/a1/f552/b2857de9952942b509503be269f2e43bc.jpg',
        link: {
          type: 'url',
          value: 'https://event.forceteller.com/event/slotmachine2',
          analytics: {
            action: 'select_content',
            properties: { content_type: 'post', item_id: 'post_1' },
          },
        },
      },
    ],
  },
  isDark: false,
};

// full_image (id 6509) — link value가 '' (드롭 대상 아님, link만 null). header에 portrait/bgImage 부재.
const rawFullImageEmptyLink = {
  id: 6509,
  type: 'full_image',
  subtype: 'item',
  status: 'S2',
  header: { title: '헤나테스트', subtitle: '해나테스트' },
  body: {
    bgColor: '#004cff',
    items: [
      {
        image:
          'https://api-dev.gc.forceteller.com/s3/fctll/_2/5c/8b02/e33880fc7574ea7952a28c9f89f32ef3c.png',
        link: { type: 'url', value: '' },
      },
    ],
  },
  isDark: false,
};

// full_image (id 6547) — image '' → 포스트 드롭.
const rawFullImageNoImage = {
  id: 6547,
  type: 'full_image',
  subtype: 'item',
  header: { title: '스트테', subtitle: '스트테' },
  body: {
    bgColor: '#c33c3c',
    items: [
      {
        image: '',
        link: { type: 'url', value: 'https://hub-dev.forceteller.com/charge' },
      },
    ],
  },
  isDark: false,
};

// thumbnail (id 400) — items 5개. item[0]은 image:null, price:0, promo:null. header에 bgImage.
const rawThumbnail = {
  id: 400,
  type: 'thumbnail',
  subtype: 'thumbnail',
  header: {
    title: '따끈따끈한 신규 운세예요',
    subtitle: '이번 주 신규 출시된',
    bgImage:
      'https://static.forceteller.com/___________b/5f/df7d/54b384cfcec844becac2a49918a88a003.png',
  },
  body: {
    items: [
      {
        title: '사주 성격, 나의 스트레스 대처 능력은?',
        image: null,
        link: {
          type: 'url',
          value: '/item/50',
          analytics: { action: 'select_content', properties: { item_id: 'post_400' } },
        },
        price: 0,
        promo: null,
      },
      {
        title: '(복사)날 좋아하게 만들고싶어!짝사랑 공략법♡',
        image:
          'https://static.forceteller.com/5/4b/52ec/47dbfdad6fb9d5c27583f3078e2df515d.jpg',
        link: { type: 'url', value: '/item/2240' },
        price: 0,
      },
      {
        title: '2022년 2월 15일 띠별 운세',
        image:
          'https://forceteller.files.wordpress.com/2022/02/ed9994ec9a94ec9dbc_eb9da0_1-2.png?w=320',
        link: { type: 'url', value: '/story/18985' },
        price: 0,
      },
      {
        title: '2022년 2월 16일 별자리 운세',
        image:
          'https://forceteller.files.wordpress.com/2022/02/ec8898ec9a94ec9dbc_ebb384ec9e90eba6ac_1-4.png?w=320',
        link: { type: 'url', value: '/story/19011' },
        price: 0,
      },
      {
        title: '2022년 2월 19일 별자리 운세',
        image:
          'https://forceteller.files.wordpress.com/2022/02/ed86a0ec9a94ec9dbc_ebb384ec9e90eba6ac_1-4.png?w=320',
        link: { type: 'url', value: '/story/19050' },
        price: 0,
      },
    ],
  },
  isDark: false,
};

// thumbnail (id 196) — body.items [] → 포스트 드롭.
const rawThumbnailEmpty = {
  id: 196,
  type: 'thumbnail',
  subtype: 'thumbnail',
  header: { title: '이 주의 TOP 3', subtitle: '붉은 호랑이들이 좋아한11' },
  body: { items: [] },
  isDark: true,
};

// icon/daily (id 6) — items 4개. link.params.state 보존, 마지막 item(dream)은 params 없음. isDark true.
const rawIcon = {
  id: 6,
  type: 'icon',
  subtype: 'daily',
  header: { title: '어떤 하루가 될까요?', subtitle: '이승환_Martin2님의 오늘은' },
  body: {
    items: [
      {
        title: '88점',
        image: 'https://static.forceteller.com/images/today/icons/ic_today_lucky.png',
        caption: '별자리 행운 지수',
        link: {
          type: 'url',
          value: '/calc/daily',
          params: {
            state: { code: 'd_luck', extra: { extra: 'PROFILE', resultKey: 'kP7J_' } },
          },
          analytics: { action: 'select_content', properties: { item_id: 'post_6' } },
        },
      },
      {
        title: 'A-',
        image: 'https://static.forceteller.com/images/today/icons/ic_today_love.png',
        caption: '별자리 애정 지수',
        link: {
          type: 'url',
          value: '/calc/daily',
          params: {
            state: { code: 'd_love', extra: { extra: 'PROFILE', resultKey: 'mkeY_' } },
          },
        },
      },
      {
        title: '주꾸미 볶음',
        image: 'https://static.forceteller.com/images/today/icons/ic_today_menu.png',
        caption: '사주 추천 메뉴',
        link: {
          type: 'url',
          value: '/calc/daily',
          params: {
            state: { code: 'd_food', extra: { extra: 'PROFILE', resultKey: 'DALo_' } },
          },
        },
      },
      {
        title: '꿈 해몽',
        image: 'https://static.forceteller.com/images/today/icons/ic_today_dream.png',
        caption: '바로 가기',
        link: { type: 'url', value: '/dream' },
      },
    ],
  },
  isDark: true,
};

// icon/daily_weather (id 355) → weather. item.title("25º 비") → temp. isDark true, header bgImage.
const rawWeather = {
  id: 355,
  type: 'icon',
  subtype: 'daily_weather',
  header: {
    title: '외출 시 우산 필수예요',
    subtitle: '오늘 종로구 날씨',
    bgImage:
      'https://static.forceteller.com/images/weather/bg/summer_night_rainy_hot.jpg',
  },
  body: {
    items: [
      {
        title: '25º 비',
        caption: '미세 좋음 · 초미세 좋음',
        image:
          'https://static.forceteller.com/images/weather/icons/icon_night_rainy.png',
        link: {
          type: 'url',
          value: 'https://event.forceteller.com/weather',
          analytics: { action: 'select_content', properties: { item_id: 'post_355' } },
        },
      },
    ],
  },
  isDark: true,
};

// chat (id 8) — Phase1 미지원 → 드롭. 실제 body.items는 중첩 배열이나 type 기준으로 body 접근 전에 드롭됨.
const rawChat = {
  id: 8,
  type: 'chat',
  subtype: 'tarot',
  header: { title: '타로 오늘의 운세', subtitle: '야이샤의', portrait: 'https://x/p.png' },
  body: { items: [] },
  isDark: false,
};

// gift (id 6542) — Phase1 미지원 → 드롭.
const rawGift = {
  id: 6542,
  type: 'gift',
  subtype: 'multi_gift',
  header: { title: '다중 선물형 테스트', subtitle: '로즈 테스트' },
  body: { items: [] },
  isDark: false,
};

describe('normalizeTodayPosts', () => {
  // ─── 타입/서브타입 매핑 ───

  it('full_image: body.items[0]→item, url 링크 보존(analytics 드롭)', () => {
    const [p] = normalizeTodayPosts([rawFullImage]);
    expect(p).toMatchObject({ id: 1, type: 'full_image', isDark: false });
    if (p.type !== 'full_image') throw new Error('unreachable');
    expect(p.item).toEqual({
      image:
        'https://static.forceteller.com/9/a1/f552/b2857de9952942b509503be269f2e43bc.jpg',
      link: { type: 'url', value: 'https://event.forceteller.com/event/slotmachine2' },
    });
    // header portrait/bgImage 부재 → null.
    expect(p.header).toEqual({
      title: '슬롯머신 돌려야죠',
      subtitle: '이승환_Martin2님, 포스가 부족한가요?',
      portrait: null,
      bgImage: null,
    });
  });

  it('full_image: 링크 value가 빈 문자열이면 link는 null (포스트는 유지)', () => {
    const [p] = normalizeTodayPosts([rawFullImageEmptyLink]);
    if (p.type !== 'full_image') throw new Error('unreachable');
    expect(p.item.link).toBeNull();
    expect(p.item.image).toContain('e33880fc7574ea7952a28c9f89f32ef3c.png');
  });

  it('thumbnail: items[] 매핑, image null 허용, price(0) 보존, analytics 드롭', () => {
    const [p] = normalizeTodayPosts([rawThumbnail]);
    if (p.type !== 'thumbnail') throw new Error('unreachable');
    expect(p.items).toHaveLength(5);
    expect(p.items[0]).toEqual({
      title: '사주 성격, 나의 스트레스 대처 능력은?',
      image: null,
      price: 0,
      link: { type: 'url', value: '/item/50' },
    });
    expect(p.items[1].image).toContain('47dbfdad6fb9d5c27583f3078e2df515d.jpg');
    expect(p.header.bgImage).toContain('54b384cfcec844becac2a49918a88a003.png');
    expect(p.header.portrait).toBeNull();
  });

  it('icon/daily → icon: items[] 매핑 + link.params(state) 보존, params 없으면 생략', () => {
    const [p] = normalizeTodayPosts([rawIcon]);
    expect(p).toMatchObject({ id: 6, type: 'icon', isDark: true });
    if (p.type !== 'icon') throw new Error('unreachable');
    expect(p.items).toHaveLength(4);
    expect(p.items[0]).toEqual({
      title: '88점',
      image: 'https://static.forceteller.com/images/today/icons/ic_today_lucky.png',
      caption: '별자리 행운 지수',
      link: {
        type: 'url',
        value: '/calc/daily',
        params: {
          state: { code: 'd_luck', extra: { extra: 'PROFILE', resultKey: 'kP7J_' } },
        },
      },
    });
    // 마지막 item은 params 없음 → link에 params 키 없음.
    expect(p.items[3].link).toEqual({ type: 'url', value: '/dream' });
  });

  it('icon/daily_weather → weather: item.title→temp, item.caption/image 보존', () => {
    const [p] = normalizeTodayPosts([rawWeather]);
    expect(p).toMatchObject({ id: 355, type: 'weather', isDark: true });
    if (p.type !== 'weather') throw new Error('unreachable');
    expect(p.item).toEqual({
      temp: '25º 비',
      caption: '미세 좋음 · 초미세 좋음',
      image:
        'https://static.forceteller.com/images/weather/icons/icon_night_rainy.png',
      link: { type: 'url', value: 'https://event.forceteller.com/weather' },
    });
    expect(p.header.bgImage).toContain('summer_night_rainy_hot.jpg');
  });

  it('header: 빈 문자열/부재 subtitle·portrait·bgImage는 null', () => {
    const [p] = normalizeTodayPosts([
      {
        id: 99,
        type: 'full_image',
        subtype: 'item',
        header: { title: 't', subtitle: '', portrait: '', bgImage: '' },
        body: { items: [{ image: 'https://x/y.png', link: { type: 'url', value: '' } }] },
        isDark: false,
      },
    ]);
    expect(p.header).toEqual({
      title: 't',
      subtitle: null,
      portrait: null,
      bgImage: null,
    });
  });

  it('지원 4타입을 한 번에 정규화하며 순서를 보존하고 미지원은 드롭한다', () => {
    const result = normalizeTodayPosts([
      rawChat, // drop
      rawFullImage,
      rawThumbnailEmpty, // drop
      rawThumbnail,
      rawGift, // drop
      rawIcon,
      rawWeather,
    ]);
    expect(result.map(p => `${p.id}:${p.type}`)).toEqual([
      '1:full_image',
      '400:thumbnail',
      '6:icon',
      '355:weather',
    ]);
  });

  // ─── 드롭 정책 (렌더 불가/미지원만 드롭, forward-compat) ───

  it('gift/chat 타입은 드롭한다 (Phase1 미지원)', () => {
    expect(normalizeTodayPosts([rawChat, rawGift])).toEqual([]);
  });

  it('unknown top-level type은 드롭한다 (forward compat)', () => {
    expect(normalizeTodayPosts([{ ...rawFullImage, type: 'hologram' }])).toEqual([]);
  });

  it('unknown icon subtype은 드롭한다', () => {
    expect(normalizeTodayPosts([{ ...rawIcon, subtype: 'daily_hologram' }])).toEqual([]);
  });

  it('title 없는 header 포스트는 드롭한다', () => {
    expect(
      normalizeTodayPosts([{ ...rawFullImage, header: { subtitle: 'x' } }]),
    ).toEqual([]);
  });

  it('이미지 없는 full_image는 드롭한다', () => {
    expect(normalizeTodayPosts([rawFullImageNoImage])).toEqual([]);
  });

  it('이미지 없는 weather는 드롭한다', () => {
    const noImage = {
      ...rawWeather,
      body: { items: [{ title: '25º 비', caption: 'c', image: '', link: { type: 'url', value: '' } }] },
    };
    expect(normalizeTodayPosts([noImage])).toEqual([]);
  });

  it('빈 items thumbnail은 드롭한다', () => {
    expect(normalizeTodayPosts([rawThumbnailEmpty])).toEqual([]);
  });

  it('빈 items icon은 드롭한다', () => {
    expect(normalizeTodayPosts([{ ...rawIcon, body: { items: [] } }])).toEqual([]);
  });

  it('이미지 없는 icon item은 개별 드롭하고, 전부 없으면 포스트를 드롭한다', () => {
    const [p] = normalizeTodayPosts([
      {
        ...rawIcon,
        body: {
          items: [
            { title: 'no-img', caption: 'c', link: { type: 'url', value: '/x' } },
            {
              title: '88점',
              image: 'https://x/icon.png',
              caption: '별자리 행운 지수',
              link: { type: 'url', value: '/calc/daily' },
            },
          ],
        },
      },
    ]);
    if (p.type !== 'icon') throw new Error('unreachable');
    expect(p.items).toHaveLength(1);
    expect(p.items[0].title).toBe('88점');
    // 이미지 있는 item이 하나도 없으면 포스트 자체 드롭.
    const allNoImg = {
      ...rawIcon,
      body: { items: [{ title: 'x', caption: 'c', link: { type: 'url', value: '/x' } }] },
    };
    expect(normalizeTodayPosts([allNoImg])).toEqual([]);
  });

  it('title 없는 thumbnail item은 개별 드롭하고, 전부 없으면 포스트를 드롭한다', () => {
    const [p] = normalizeTodayPosts([
      {
        ...rawThumbnail,
        body: {
          items: [
            { title: '', image: 'https://x/a.png', price: 0, link: { type: 'url', value: '/a' } },
            {
              title: '유효 항목',
              image: 'https://x/b.png',
              price: 0,
              link: { type: 'url', value: '/item/1' },
            },
          ],
        },
      },
    ]);
    if (p.type !== 'thumbnail') throw new Error('unreachable');
    expect(p.items).toHaveLength(1);
    expect(p.items[0].title).toBe('유효 항목');
    // title 있는 item이 하나도 없으면 포스트 자체 드롭.
    const allNoTitle = {
      ...rawThumbnail,
      body: {
        items: [{ title: '', image: 'https://x/a.png', price: 0, link: { type: 'url', value: '/a' } }],
      },
    };
    expect(normalizeTodayPosts([allNoTitle])).toEqual([]);
  });

  it('url이 아닌 링크(api 등)는 null로 정규화한다', () => {
    const [p] = normalizeTodayPosts([
      {
        ...rawFullImage,
        body: {
          items: [
            {
              image: 'https://x/y.png',
              link: { type: 'api', value: '/api/x', method: 'POST' },
            },
          ],
        },
      },
    ]);
    if (p.type !== 'full_image') throw new Error('unreachable');
    expect(p.item.link).toBeNull();
  });
});
