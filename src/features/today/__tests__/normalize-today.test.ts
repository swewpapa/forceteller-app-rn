import { normalizeTodayHero, normalizeTodayPosts } from '../api/normalize-today';

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
    expect(p.item?.link).toBeNull();
    expect(p.item?.image).toContain('e33880fc7574ea7952a28c9f89f32ef3c.png');
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

  it('여러 타입을 순서 보존하며 정규화한다', () => {
    const result = normalizeTodayPosts([rawFullImage, rawThumbnail, rawIcon, rawWeather]);
    expect(result.map(p => `${p.id}:${p.type}`)).toEqual([
      '1:full_image',
      '400:thumbnail',
      '6:icon',
      '355:weather',
    ]);
  });

  // ─── 드롭 정책: header(title) 없으면만 드롭. 컨텐츠(이미지/아이템)는 옵션 → 헤더 전용 렌더 허용. ───

  it('gift(유효 아이템 없음)·chat(피커 없음)은 드롭한다', () => {
    expect(normalizeTodayPosts([rawChat, rawGift])).toEqual([]);
  });

  it('unknown top-level type은 드롭한다 (forward compat)', () => {
    expect(normalizeTodayPosts([{ ...rawFullImage, type: 'hologram' }])).toEqual([]);
  });

  it('unknown icon subtype은 드롭한다', () => {
    expect(normalizeTodayPosts([{ ...rawIcon, subtype: 'daily_hologram' }])).toEqual([]);
  });

  it('title 없는 header 포스트는 드롭한다', () => {
    expect(normalizeTodayPosts([{ ...rawFullImage, header: { subtitle: 'x' } }])).toEqual([]);
  });

  it('이미지 없는 full_image는 헤더만 렌더한다(item null)', () => {
    const [p] = normalizeTodayPosts([rawFullImageNoImage]);
    if (p.type !== 'full_image') throw new Error('unreachable');
    expect(p.item).toBeNull();
  });

  it('이미지 없는 weather는 헤더만 렌더한다(item null)', () => {
    const noImage = {
      ...rawWeather,
      body: { items: [{ title: '25º 비', caption: 'c', image: '', link: { type: 'url', value: '' } }] },
    };
    const [p] = normalizeTodayPosts([noImage]);
    if (p.type !== 'weather') throw new Error('unreachable');
    expect(p.item).toBeNull();
  });

  it('빈 items thumbnail은 헤더만 렌더한다(items [])', () => {
    const [p] = normalizeTodayPosts([rawThumbnailEmpty]);
    if (p.type !== 'thumbnail') throw new Error('unreachable');
    expect(p.items).toEqual([]);
  });

  it('빈 items icon은 헤더만 렌더한다(items [])', () => {
    const [p] = normalizeTodayPosts([{ ...rawIcon, body: { items: [] } }]);
    if (p.type !== 'icon') throw new Error('unreachable');
    expect(p.items).toEqual([]);
  });

  it('이미지 없는 icon item은 개별 드롭하고, 전부 없으면 빈 items로 렌더한다', () => {
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
    // 이미지 있는 item이 없으면 빈 items로 렌더(포스트 유지).
    const [q] = normalizeTodayPosts([
      { ...rawIcon, body: { items: [{ title: 'x', caption: 'c', link: { type: 'url', value: '/x' } }] } },
    ]);
    if (q.type !== 'icon') throw new Error('unreachable');
    expect(q.items).toEqual([]);
  });

  it('title 없는 thumbnail item은 개별 드롭하고, 전부 없으면 빈 items로 렌더한다', () => {
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
    // title 있는 item이 없으면 빈 items로 렌더(포스트 유지).
    const [q] = normalizeTodayPosts([
      { ...rawThumbnail, body: { items: [{ title: '', image: 'https://x/a.png', price: 0, link: { type: 'url', value: '/a' } }] } },
    ]);
    if (q.type !== 'thumbnail') throw new Error('unreachable');
    expect(q.items).toEqual([]);
  });

  it('api 링크는 {type:api, endpoint, method}로 보존한다 (포스트 타입 무관 공통)', () => {
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
    expect(p.item?.link).toEqual({ type: 'api', endpoint: '/api/x', method: 'POST' });
  });

  it('api 링크에 method 없으면 POST 기본값', () => {
    const [p] = normalizeTodayPosts([
      {
        ...rawFullImage,
        body: { items: [{ image: 'https://x/y.png', link: { type: 'api', value: '/api/x' } }] },
      },
    ]);
    if (p.type !== 'full_image') throw new Error('unreachable');
    expect(p.item?.link).toEqual({ type: 'api', endpoint: '/api/x', method: 'POST' });
  });

  it('미지 type 링크나 value 없으면 null', () => {
    const [p] = normalizeTodayPosts([
      {
        ...rawFullImage,
        body: { items: [{ image: 'https://x/y.png', link: { type: 'weird', value: '/a' } }] },
      },
    ]);
    if (p.type !== 'full_image') throw new Error('unreachable');
    expect(p.item?.link).toBeNull();
  });

  it('gift: 티켓 아이템 + 버튼(api action 보존, amount HTML 스트립)', () => {
    const [p] = normalizeTodayPosts([
      {
        id: 6536,
        type: 'gift',
        subtype: 'multi_gift',
        header: { title: '선물', subtitle: '로즈' },
        body: {
          items: [
            {
              title: '선물 외 3개',
              amount: '<b>X7</b>',
              color: '#E85E5E',
              icon: 'https://x/saletag.png',
              buttons: [
                {
                  text: '쿠폰 받기',
                  icon: 'https://x/ic_download.svg',
                  disabled: false,
                  link: { type: 'api', value: '/api/post/6536/gifts', method: 'POST' },
                },
                { text: '사용하기', icon: 'https://x/ic_arrow_right.svg', disabled: true },
              ],
            },
          ],
        },
        isDark: false,
      },
    ] as unknown as Parameters<typeof normalizeTodayPosts>[0]);
    if (p.type !== 'gift') throw new Error('unreachable');
    expect(p.items[0]).toMatchObject({
      title: '선물 외 3개',
      amount: 'X7',
      color: '#E85E5E',
      iconUrl: 'https://x/saletag.png',
    });
    expect(p.items[0].buttons[0]).toEqual({
      text: '쿠폰 받기',
      iconUrl: 'https://x/ic_download.svg',
      disabled: false,
      action: { type: 'api', endpoint: '/api/post/6536/gifts', method: 'POST' },
    });
    expect(p.items[0].buttons[1]).toEqual({
      text: '사용하기',
      iconUrl: 'https://x/ic_arrow_right.svg',
      disabled: true,
      action: null,
    });
  });

  it('gift: title 없는 아이템만 있으면 포스트 드롭', () => {
    expect(
      normalizeTodayPosts([
        {
          id: 1,
          type: 'gift',
          subtype: 'multi_gift',
          header: { title: 't' },
          body: { items: [{ amount: 'X1', buttons: [] }] },
          isDark: false,
        },
      ] as unknown as Parameters<typeof normalizeTodayPosts>[0]),
    ).toEqual([]);
  });

  it('chat tarot: 말풍선 + 단일카드 + submit api', () => {
    const [p] = normalizeTodayPosts([
      {
        id: 8,
        type: 'chat',
        subtype: 'tarot',
        header: { title: '타로', subtitle: '아이샤', portrait: 'https://x/p.png' },
        body: {
          items: [
            [{ v: '반가워요' }, { t: 'image', src: 'https://x/img.jpg', link: { type: 'url', value: '' } }],
            [
              {
                v: '좌우로 스와이프',
                a: [
                  {
                    t: 'button',
                    button: {
                      text: '이 카드로 할게요',
                      type: 'submit',
                      link: { type: 'api', value: '/api/daily/calc/d_tarot', method: 'POST' },
                    },
                  },
                ],
              },
              { t: 'tarot', src: 'https://x/card.png' },
            ],
          ],
        },
        isDark: false,
      },
    ] as unknown as Parameters<typeof normalizeTodayPosts>[0]);
    if (p.type !== 'chat') throw new Error('unreachable');
    expect(p.messages).toEqual([
      { kind: 'text', text: '반가워요' },
      { kind: 'image', src: 'https://x/img.jpg' },
    ]);
    expect(p.picker).toEqual({
      kind: 'tarot',
      caption: '좌우로 스와이프',
      cardSrc: 'https://x/card.png',
      submitText: '이 카드로 할게요',
      submit: { type: 'api', endpoint: '/api/daily/calc/d_tarot', method: 'POST' },
    });
  });

  it('chat carousel: 캡션 a[]의 이미지들이 선택 카드 + bgColor 보존', () => {
    const [p] = normalizeTodayPosts([
      {
        id: 7,
        type: 'chat',
        subtype: 'proverb',
        header: { title: '띵언', subtitle: '까리나' },
        body: {
          bgColor: '#ACD9FF',
          items: [
            [{ v: '오늘도 안녕!' }],
            [
              {
                v: '좌우로 스와이프',
                a: [
                  { t: 'image', src: 'https://x/t1.png', link: { type: 'api', value: '/api/daily/calc/d_proverb', method: 'POST' } },
                  { t: 'image', src: 'https://x/t2.png', link: { type: 'api', value: '/api/daily/calc/d_proverb', method: 'POST' } },
                ],
              },
              { t: 'carousel' },
            ],
          ],
        },
        isDark: false,
      },
    ] as unknown as Parameters<typeof normalizeTodayPosts>[0]);
    if (p.type !== 'chat') throw new Error('unreachable');
    expect(p.bgColor).toBe('#ACD9FF');
    if (p.picker.kind !== 'carousel') throw new Error('expected carousel');
    expect(p.picker.cards).toEqual([
      { src: 'https://x/t1.png', action: { type: 'api', endpoint: '/api/daily/calc/d_proverb', method: 'POST' } },
      { src: 'https://x/t2.png', action: { type: 'api', endpoint: '/api/daily/calc/d_proverb', method: 'POST' } },
    ]);
  });
});

describe('normalizeTodayHero', () => {
  // dev 실응답(GET /api/today/hero, 게스트) 발췌.
  const rawHero = {
    todaySimple: '7/14 화',
    caption: '지금 가입하시고',
    sub: '매일 새로워지는\n오늘의 운세를 만나보세요.',
    heroImage: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=',
    backgroundImage: 'https://static.forceteller.com/images/today/hero_section_bg/v2/today_bg_summer_day.svg',
    link: { type: 'url', value: '/calc/daily', params: { state: { code: 'd_sazoo' } } },
    textColor: '#27484E',
    iconColor: 'white',
  };

  it('raw 히어로를 도메인으로 매핑한다', () => {
    expect(normalizeTodayHero(rawHero)).toEqual({
      date: '7/14 화',
      caption: '지금 가입하시고',
      headline: '매일 새로워지는\n오늘의 운세를 만나보세요.',
      backgroundImage: rawHero.backgroundImage,
      animalImage: rawHero.heroImage,
      link: { type: 'url', value: '/calc/daily', params: { state: { code: 'd_sazoo' } } },
      textColor: '#27484E',
      iconColor: 'white',
    });
  });

  it('headline(sub) 없으면 null', () => {
    expect(normalizeTodayHero({ ...rawHero, sub: undefined })).toBeNull();
    expect(normalizeTodayHero({ ...rawHero, sub: '' })).toBeNull();
  });

  it('textColor/iconColor 미지정 시 폴백(#191919 / white)', () => {
    const hero = normalizeTodayHero({ sub: '헤드라인' });
    expect(hero?.textColor).toBe('#191919');
    expect(hero?.iconColor).toBe('white');
  });

  it('date/caption/이미지 부재 시 빈 문자열, value 없는 link는 null', () => {
    const hero = normalizeTodayHero({ sub: '헤드라인', link: { type: 'url' } });
    expect(hero).toEqual({
      date: '',
      caption: '',
      headline: '헤드라인',
      backgroundImage: '',
      animalImage: '',
      link: null,
      textColor: '#191919',
      iconColor: 'white',
    });
  });
});
