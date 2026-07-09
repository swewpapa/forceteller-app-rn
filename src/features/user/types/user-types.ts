// features/auth — 로그인 사용자 도메인 타입.
// "무엇인가"를 표현하는 도메인 어휘(조회 방법은 user-api의 메서드명이 담당).

/** GET /api/users/me — 로그인 사용자 기본 정보. */
export type AuthUser = {
  id: number;
  name: string;
  email: string | null;
  avatarURL: string | null;
  isGuest: boolean;
};

/** GET /api/users/me/profile — 사주 프로필(생년월일시 + 출생지). */
export type UserProfile = {
  name: string;
  gender: string;
  calendar: string;
  year: number;
  month: number;
  day: number;
  hour: number | null;
  min: number | null;
  city: { name: string; fullName: string; timeZoneId: string } | null;
};
