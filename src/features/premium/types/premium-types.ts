export type PremiumLink =
  | { type: 'url'; value: string }
  | { type: 'api'; value: string; keyword: string };

/** 카테고리(subjects) 링크. url + 선택 쿼리 params(genre id / keyword 값). */
export type PremiumSubjectLink = {
  type: 'url';
  value: string;
  params?: Record<string, unknown>;
};

/** 카테고리 항목. genre는 iconUrl(원격 PNG)·옵션 tag("new!!!"), keyword는 텍스트만. */
export type PremiumSubjectItem = {
  name: string;
  iconUrl: string | null;
  link: PremiumSubjectLink | null;
  tag: string | null;
};

/** GET /api/premium/subjects — 장르(genres)/주제(keywords) 카테고리. */
export type PremiumSubjects = {
  genres: PremiumSubjectItem[];
  keywords: PremiumSubjectItem[];
};

export type PremiumItem = {
  id: number;
  title: string;
  subtitle: string | null;
  thumbnailImage: string | null;
  price: number | null; // general/rank만 non-null
  link: PremiumLink;
};

export type PremiumTag = { text: string; link: PremiumLink };

type PremiumBase = { id: number; title: string; subtitle: string | null };

export type Premium =
  | (PremiumBase & { type: 'rank'; items: PremiumItem[]; moreLink: PremiumLink | null })
  | (PremiumBase & { type: 'general'; items: PremiumItem[]; moreLink: PremiumLink | null })
  | (PremiumBase & { type: 'banner'; image: string; bgColor: string; link: PremiumLink })
  | (PremiumBase & {
      type: 'carousel';
      items: PremiumItem[];
      thumbnail: { width: number; height: number };
      moreLink: PremiumLink | null;
    })
  | (PremiumBase & { type: 'button'; items: PremiumItem[]; moreLink: PremiumLink | null })
  | (PremiumBase & { type: 'tag'; tags: PremiumTag[] });
