import {
  getZodiacName,
  getConstellation,
  getHourBranch,
  formatBirth,
} from '@/features/user/lib/profile-display';

describe('profile-display', () => {
  describe('getZodiacName', () => {
    it('1991 → 양띠 (디자인 예시)', () => expect(getZodiacName(1991)).toBe('양띠'));
    it('2020 → 쥐띠', () => expect(getZodiacName(2020)).toBe('쥐띠'));
    it('2008 → 쥐띠 (12주기)', () => expect(getZodiacName(2008)).toBe('쥐띠'));
    it('2022 → 호랑이띠', () => expect(getZodiacName(2022)).toBe('호랑이띠'));
  });

  describe('getConstellation', () => {
    it('6/28 → 게자리 (디자인 예시)', () => expect(getConstellation(6, 28)).toBe('게자리'));
    it('경계 6/21 → 쌍둥이자리', () => expect(getConstellation(6, 21)).toBe('쌍둥이자리'));
    it('경계 6/22 → 게자리', () => expect(getConstellation(6, 22)).toBe('게자리'));
    it('1/1 → 염소자리', () => expect(getConstellation(1, 1)).toBe('염소자리'));
    it('12/31 → 염소자리', () => expect(getConstellation(12, 31)).toBe('염소자리'));
    it('1/20 → 물병자리', () => expect(getConstellation(1, 20)).toBe('물병자리'));
  });

  describe('getHourBranch', () => {
    it('9시 → 巳 (디자인 예시)', () => expect(getHourBranch(9)).toBe('巳'));
    it('10시 → 巳 (巳時 9~11)', () => expect(getHourBranch(10)).toBe('巳'));
    it('23시 → 子', () => expect(getHourBranch(23)).toBe('子'));
    it('0시 → 子', () => expect(getHourBranch(0)).toBe('子'));
    it('1시 → 丑', () => expect(getHourBranch(1)).toBe('丑'));
    it('null → null', () => expect(getHourBranch(null)).toBeNull());
  });

  describe('formatBirth', () => {
    it('양력 1991.6.28 9시 → "양력 1991. 6. 28. 巳시" (디자인 예시)', () =>
      expect(formatBirth({ calendar: 'S', year: 1991, month: 6, day: 28, hour: 9 })).toBe(
        '양력 1991. 6. 28. 巳시',
      ));
    it('hour null → 時 생략', () =>
      expect(formatBirth({ calendar: 'S', year: 1991, month: 6, day: 28, hour: null })).toBe(
        '양력 1991. 6. 28.',
      ));
    it('음력(L) 라벨', () =>
      expect(formatBirth({ calendar: 'L', year: 1990, month: 1, day: 1, hour: null })).toBe(
        '음력 1990. 1. 1.',
      ));
  });
});
