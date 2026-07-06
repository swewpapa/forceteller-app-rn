import { normalizeThemeWidgets } from '../api/normalize-theme-widgets';

/** dev 실응답(GET /api/theme/list/recommend_top) 축약 픽스처 */
const rawTextOnly = {
  id: 41,
  uuid: 'c2cf77ef-bba4-41ab-8c62-5868a6cd6b43',
  code: 'recommend_top',
  type: 'text_only',
  title: '실시간 인기 급상승',
  subtitle: '지금 대세',
  themeViews: [
    {
      id: 1837, viewId: 133763, type: 'item', title: '연애로 본 내 숨겨진 욕망',
      subtitle: null, thumbnail_image: 'https://static.example.com/a.jpg', full_image: '',
      label_text: '사주', label_color: '#DE8064', isNew: false,
      link: { type: 'url', value: '/item/1837' },
    },
    {
      id: 3, viewId: 62431, type: 'custom', title: '그 사람이 내 고백을 받아줄까요?',
      subtitle: '', thumbnail_image: '', label_text: 'HIT', label_color: '#A2A2A2',
      link: { type: 'url', value: '/item/1872' },
    },
  ],
};

const rawKeywordCloud = {
  id: 8, uuid: 'd8161dc4-71b4-4a11-8ac7-9603348de9ca', code: 'recommend_top',
  type: 'keyword_cloud', title: '예지 꿈 해몽', subtitle: '무서운 꿈을 꾸었구나',
  themeViews: [
    {
      id: -1, viewId: 2669, type: 'keyword_dreams',
      keywords: [
        { text: '바다', link: { type: 'url', value: '/dream', params: { queryParams: { keyword: '바다' } } } },
        { text: '더보기', class: 'more', link: { type: 'url', value: '/dream' } },
        { text: 'link 없는 키워드' },
      ],
    },
  ],
};

describe('normalizeThemeWidgets', () => {
  it('text_only 위젯을 views와 함께 매핑한다', () => {
    const [w] = normalizeThemeWidgets([rawTextOnly]);
    expect(w).toMatchObject({
      id: 41, uuid: 'c2cf77ef-bba4-41ab-8c62-5868a6cd6b43',
      type: 'text_only', title: '실시간 인기 급상승', subtitle: '지금 대세',
    });
    if (w.type !== 'text_only') throw new Error('unreachable');
    expect(w.views).toHaveLength(2);
    expect(w.views[0]).toEqual({
      id: 1837, viewId: 133763, title: '연애로 본 내 숨겨진 욕망',
      subtitle: null, label: { text: '사주', color: '#DE8064' },
      thumbnailImage: 'https://static.example.com/a.jpg', fullImage: null,
      link: { type: 'url', value: '/item/1837' }, isNew: false,
    });
  });

  it("''(빈 문자열) subtitle/이미지는 null로 정규화한다", () => {
    const [w] = normalizeThemeWidgets([rawTextOnly]);
    if (w.type !== 'text_only') throw new Error('unreachable');
    expect(w.views[1].subtitle).toBeNull();
    expect(w.views[1].thumbnailImage).toBeNull();
  });

  it('thumbnail_carousel / full_image_carousel도 views로 매핑한다', () => {
    const widgets = normalizeThemeWidgets([
      { ...rawTextOnly, id: 1, uuid: 'u1', type: 'thumbnail_carousel' },
      { ...rawTextOnly, id: 2, uuid: 'u2', type: 'full_image_carousel' },
    ]);
    expect(widgets.map(w => w.type)).toEqual(['thumbnail_carousel', 'full_image_carousel']);
  });

  it('keyword_cloud는 themeViews[0].keywords를 keywords로 승격하고, link 없는 키워드는 드롭한다', () => {
    const [w] = normalizeThemeWidgets([rawKeywordCloud]);
    if (w.type !== 'keyword_cloud') throw new Error('unreachable');
    expect(w.keywords).toEqual([
      { text: '바다', isMore: false, link: { type: 'url', value: '/dream', queryParams: { keyword: '바다' } } },
      { text: '더보기', isMore: true, link: { type: 'url', value: '/dream' } },
    ]);
  });

  it('keyword_cloud의 키워드가 전부 link 없으면 위젯을 드롭한다', () => {
    expect(normalizeThemeWidgets([{
      id: 8, uuid: 'u8', type: 'keyword_cloud', title: '예지 꿈 해몽', subtitle: '',
      themeViews: [{ id: -1, viewId: 2669, keywords: [{ text: '링크없음1' }, { text: '링크없음2' }] }],
    }])).toEqual([]);
  });

  it('unknown type 위젯은 드롭한다 (forward compat)', () => {
    expect(normalizeThemeWidgets([{ ...rawTextOnly, type: 'hologram_banner' }])).toEqual([]);
  });

  it('themeViews가 없거나 빈 위젯은 드롭한다', () => {
    expect(normalizeThemeWidgets([
      { id: 78, uuid: 'u78', type: 'thumbnail_carousel', title: '헤나테스트', subtitle: '' },
      { ...rawTextOnly, themeViews: [] },
    ])).toEqual([]);
  });

  it('link 없는 view는 드롭하고, 유효 view가 0이면 위젯도 드롭한다', () => {
    const noLink = { ...rawTextOnly, themeViews: [{ id: 9, viewId: 9, title: 'x' }] };
    expect(normalizeThemeWidgets([noLink])).toEqual([]);
  });

  it('label_text/label_color 쌍이 불완전하면 label은 null', () => {
    const [w] = normalizeThemeWidgets([{
      ...rawTextOnly,
      themeViews: [{ id: 1, viewId: 1, title: 't', label_text: '사주', link: { type: 'url', value: '/x' } }],
    }]);
    if (w.type !== 'text_only') throw new Error('unreachable');
    expect(w.views[0].label).toBeNull();
  });

  it('tag_filter 링크를 보존하고, unknown link type인 view는 드롭한다', () => {
    const [w] = normalizeThemeWidgets([{
      ...rawTextOnly,
      themeViews: [
        { id: 1, viewId: 1, title: 'a', link: { type: 'tag_filter', value: 'all' } },
        { id: 2, viewId: 2, title: 'b', link: { type: 'deeplink', value: 'x://y' } },
      ],
    }]);
    if (w.type !== 'text_only') throw new Error('unreachable');
    expect(w.views).toEqual([
      expect.objectContaining({ link: { type: 'tag_filter', value: 'all' } }),
    ]);
  });
});
