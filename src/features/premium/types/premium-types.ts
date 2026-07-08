export type PremiumLink =
  | { type: 'url'; value: string }
  | { type: 'api'; value: string; keyword: string };

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
