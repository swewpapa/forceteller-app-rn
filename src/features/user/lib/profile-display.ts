import type { UserProfile } from '../types/user-types';

/**
 * 프로필(생년월일시) → 마이페이지 표시 문자열 변환. 순수함수.
 * ⚠️ 단순 규칙 기반(레거시/대중앱 관례): 입춘·음력변환 등 정밀 사주 보정은 미반영.
 */

// 12지 띠. (year - 4) % 12 = 0(자/쥐). ⚠️ 입춘/음력설 경계는 미반영(양력 연도 기준).
const ZODIAC = ['쥐', '소', '호랑이', '토끼', '용', '뱀', '말', '양', '원숭이', '닭', '개', '돼지'];

export function getZodiacName(year: number): string {
  const idx = (((year - 4) % 12) + 12) % 12;
  return `${ZODIAC[idx]}띠`;
}

// 양력 별자리 경계(각 별자리의 마지막 월/일). ⚠️ 음력 생일이면 solar 변환 후 계산해야 정확.
const SIGNS: { name: string; untilMonth: number; untilDay: number }[] = [
  { name: '염소자리', untilMonth: 1, untilDay: 19 },
  { name: '물병자리', untilMonth: 2, untilDay: 18 },
  { name: '물고기자리', untilMonth: 3, untilDay: 20 },
  { name: '양자리', untilMonth: 4, untilDay: 19 },
  { name: '황소자리', untilMonth: 5, untilDay: 20 },
  { name: '쌍둥이자리', untilMonth: 6, untilDay: 21 },
  { name: '게자리', untilMonth: 7, untilDay: 22 },
  { name: '사자자리', untilMonth: 8, untilDay: 22 },
  { name: '처녀자리', untilMonth: 9, untilDay: 22 },
  { name: '천칭자리', untilMonth: 10, untilDay: 22 },
  { name: '전갈자리', untilMonth: 11, untilDay: 22 },
  { name: '사수자리', untilMonth: 12, untilDay: 21 },
];

export function getConstellation(month: number, day: number): string {
  for (const s of SIGNS) {
    if (month < s.untilMonth || (month === s.untilMonth && day <= s.untilDay)) {
      return s.name;
    }
  }
  return '염소자리'; // 12/22~12/31
}

// 간지시(2시간 단위, 한자). 子=23~01시. hour는 0~23 시각으로 가정.
const HOUR_HANJA = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

export function getHourBranch(hour: number | null): string | null {
  if (hour == null) return null;
  return HOUR_HANJA[Math.floor(((hour + 1) % 24) / 2) % 12];
}

// TODO(계약확인): calendar 인코딩 미확정 — 'l'/'lunar'/'음력'만 음력, 나머지 양력으로 처리.
function calendarLabel(calendar: string): string {
  const c = calendar.toLowerCase();
  return c === 'l' || c === 'lunar' || calendar === '음력' ? '음력' : '양력';
}

/** "양력 1991. 6. 28. 巳시" (hour 없으면 時 생략). */
export function formatBirth(
  profile: Pick<UserProfile, 'calendar' | 'year' | 'month' | 'day' | 'hour'>,
): string {
  const branch = getHourBranch(profile.hour);
  const time = branch ? ` ${branch}시` : '';
  return `${calendarLabel(profile.calendar)} ${profile.year}. ${profile.month}. ${profile.day}.${time}`;
}
