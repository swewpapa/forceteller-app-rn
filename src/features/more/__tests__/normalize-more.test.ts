import { normalizeMoreList } from '../api/normalize-more';

// dev 실응답(GET /api/more/list {status, data:[]})에서 발췌한 픽스처.
// 각 항목: {id, name, link:{type:'url', value}, icon:원격SVG, code, priority, status}.

const rawSaju = {
  id: 7,
  name: '내 사주 명식',
  link: { type: 'url', value: '/four' },
  icon: 'https://static.forceteller.com/a/31/b459/924fa456ffa5b0c9cdb6e877e3c47b9cd.svg',
  code: '',
  priority: 0,
  status: 'S3',
};

const rawCalendar = {
  id: 1,
  name: '운세 캘린더',
  link: { type: 'url', value: '/cal' },
  icon: 'https://static.forceteller.com/1/43/7d8a/39d03fe0f1dab7f9669170f2b1c0d38cc.svg',
  code: 'cal',
  priority: 1,
  status: 'S3',
};

// 외부 절대 URL(이벤트) — 도메인 value에 그대로 보존.
const rawEvent = {
  id: 14,
  name: '이벤트',
  link: { type: 'url', value: 'https://event.forceteller.com/leaflets' },
  icon: 'https://static.forceteller.com/1/44/882a/42b8647ea43a61a1b8a64e69b73b444f7.svg',
  code: 'leaflet',
  priority: 13,
  status: 'S3',
};

describe('normalizeMoreList', () => {
  it('유효 항목을 도메인으로 변환하고 priority 오름차순 정렬한다', () => {
    const result = normalizeMoreList([rawCalendar, rawSaju]); // 입력 순서: priority 1,0
    expect(result).toEqual([
      {
        id: 7,
        name: '내 사주 명식',
        iconUrl: rawSaju.icon,
        link: { type: 'url', value: '/four' },
        priority: 0,
      },
      {
        id: 1,
        name: '운세 캘린더',
        iconUrl: rawCalendar.icon,
        link: { type: 'url', value: '/cal' },
        priority: 1,
      },
    ]);
  });

  it('외부 절대 URL을 value에 그대로 보존한다', () => {
    const [item] = normalizeMoreList([rawEvent]);
    expect(item.link.value).toBe('https://event.forceteller.com/leaflets');
  });

  it('code/status 등 표시 무관 필드는 도메인에 넣지 않는다', () => {
    const [item] = normalizeMoreList([rawSaju]);
    expect(item).not.toHaveProperty('code');
    expect(item).not.toHaveProperty('status');
  });

  it('id 없으면 드롭', () => {
    expect(
      normalizeMoreList([{ name: '내 사주', icon: 'x.svg', link: { type: 'url', value: '/four' } }]),
    ).toEqual([]);
  });

  it('name 없으면 드롭', () => {
    expect(normalizeMoreList([{ ...rawSaju, name: '' }])).toEqual([]);
  });

  it('icon(원격 SVG) 없으면 드롭', () => {
    expect(
      normalizeMoreList([{ id: 7, name: '내 사주', link: { type: 'url', value: '/four' } }]),
    ).toEqual([]);
  });

  it('link value 없으면 드롭', () => {
    expect(normalizeMoreList([{ ...rawSaju, link: { type: 'url', value: '' } }])).toEqual([]);
  });

  it('url 이외 link type은 드롭', () => {
    expect(
      normalizeMoreList([{ ...rawSaju, link: { type: 'api', value: '/x' } }]),
    ).toEqual([]);
  });

  it('priority 없으면 0으로 취급', () => {
    expect(
      normalizeMoreList([{ id: 7, name: '내 사주', icon: 'x.svg', link: { type: 'url', value: '/four' } }])[0]
        .priority,
    ).toBe(0);
  });
});
