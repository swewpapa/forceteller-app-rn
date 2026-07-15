import { normalizePremiumSubjects } from '@/features/premium/api/normalize-premium-subjects';

// dev 실응답(GET /api/premium/subjects) 발췌.
const rawGenre = {
  name: '신년운세',
  status: 'S3',
  icon: 'https://static.forceteller.com/images/category/icon_newyear.png',
  link: { type: 'url', value: '/premium/subjects/genres', params: { queryParams: { value: 1 } } },
  tag: 'new!!!',
};
const rawKeyword = {
  name: '개운',
  link: {
    type: 'url',
    value: '/premium/subjects/keywords',
    params: { queryParams: { value: '개운' } },
  },
};

describe('normalizePremiumSubjects', () => {
  it('genre는 iconUrl/tag/link(params 보존) 매핑', () => {
    const { genres } = normalizePremiumSubjects({ genres: [rawGenre], keywords: [] });
    expect(genres).toEqual([
      {
        name: '신년운세',
        iconUrl: 'https://static.forceteller.com/images/category/icon_newyear.png',
        link: {
          type: 'url',
          value: '/premium/subjects/genres',
          params: { queryParams: { value: 1 } },
        },
        tag: 'new!!!',
      },
    ]);
  });

  it('keyword는 iconUrl/tag null, link params 보존', () => {
    const { keywords } = normalizePremiumSubjects({ keywords: [rawKeyword] });
    expect(keywords).toEqual([
      {
        name: '개운',
        iconUrl: null,
        link: {
          type: 'url',
          value: '/premium/subjects/keywords',
          params: { queryParams: { value: '개운' } },
        },
        tag: null,
      },
    ]);
  });

  it('name 없는 항목은 드롭', () => {
    const { genres } = normalizePremiumSubjects({ genres: [{ icon: 'x.png' }, rawGenre] });
    expect(genres).toHaveLength(1);
    expect(genres[0].name).toBe('신년운세');
  });

  it('genres/keywords 부재 시 빈 배열', () => {
    expect(normalizePremiumSubjects({})).toEqual({ genres: [], keywords: [] });
  });

  it('url 이외 link 또는 value 없으면 link null', () => {
    const { genres } = normalizePremiumSubjects({
      genres: [
        { name: 'A', link: { type: 'api', value: '/x' } },
        { name: 'B', link: { type: 'url' } },
      ],
    });
    expect(genres[0].link).toBeNull();
    expect(genres[1].link).toBeNull();
  });
});
