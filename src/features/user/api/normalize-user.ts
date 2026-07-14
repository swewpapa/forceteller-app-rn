import type { AuthUser, UserProfile } from '@/features/user/types/user-types';

// ─── raw 타입: 서버 응답 그대로. api/ 내부 전용 — feature 배럴로 반출 금지 ───
// (premium normalize 선례: RawResponse는 normalize 모듈에서만 export, 도메인 밖 반출 X)

type RawMe = {
  id: number;
  name: string;
  email: string | null;
  avatarURL: string | null;
  isGuest: boolean;
  // active/admin/userKey/analytics 등 나머지 서버 필드는 도메인 미반영.
};

export type UserMeResponse = { status: number; data: RawMe };

// 출생지. 서버는 geonameId/lat/lng/state/country 등도 주지만 도메인은 3필드만 사용.
type RawCity = {
  name: string;
  fullName: string;
  timeZoneId: string;
};

type RawProfile = {
  name: string;
  gender: string;
  calendar: string;
  year: number;
  month: number;
  day: number;
  hour: number | null;
  min: number | null;
  city: RawCity | null;
  // a/e/h/i/s/z(사주 간지)·avatarURL·editable 등은 도메인 미반영.
};

export type UserProfileResponse = { status: number; data: RawProfile };

// ─── 정규화 ───

function emptyToNull(value: string | null | undefined): string | null {
  return value ? value : null;
}

/** {status, data} 봉투를 언랩해 로그인 사용자 도메인으로 매핑. 빈 문자열 email/avatarURL은 null. */
export function normalizeMe(raw: UserMeResponse): AuthUser {
  const d = raw.data;
  return {
    id: d.id,
    name: d.name,
    email: emptyToNull(d.email),
    avatarURL: emptyToNull(d.avatarURL),
    isGuest: d.isGuest,
  };
}

/** {status, data} 봉투를 언랩. city는 존재 시 name/fullName/timeZoneId만 추리고, 없으면 null. */
export function normalizeProfile(raw: UserProfileResponse): UserProfile {
  const d = raw.data;
  return {
    name: d.name,
    gender: d.gender,
    calendar: d.calendar,
    year: d.year,
    month: d.month,
    day: d.day,
    hour: d.hour,
    min: d.min,
    city: d.city
      ? {
          name: d.city.name,
          fullName: d.city.fullName,
          timeZoneId: d.city.timeZoneId,
        }
      : null,
  };
}
