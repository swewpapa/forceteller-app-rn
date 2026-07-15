import { createUserApi } from '@/features/user/api/user-api';
import type { HttpClient } from '@/shared/lib';

// 실측 픽스처(scratchpad/users-me.json, users-me-profile.json)에서 그대로 옮긴 봉투.
// 도메인 미반영 필드(active/admin/userKey/analytics, city.geonameId/lat/lng 등)를
// 일부러 포함해 normalize가 핵심 필드만 추리는지(toEqual)로 검증한다.

const meEnvelope = {
  status: 200,
  data: {
    id: 8387785,
    name: '이승환_Martin2',
    email: '102745447751092147672#google',
    avatarURL: null,
    active: true,
    admin: true,
    type: null,
    enableTransfer: true,
    isDormant: null,
    createdAt: '2025-02-10T02:27:40.000+00:00',
    updatedAt: '2026-06-02T02:42:14.000+00:00',
    anonymous: false,
    userKey: '0426we',
    isGuest: false,
    analytics: { properties: { seg: 'comeback' } },
  },
};

const profileEnvelope = {
  status: 200,
  data: {
    calendar: 'S',
    gender: 'M',
    avatarURL: 'https://static.forceteller.com/images/animal/v5/circle_colored_24.png',
    year: 1987,
    city: {
      geonameId: 1835847,
      name: '서울특별시',
      lat: 37.58333,
      lng: 127.0,
      timeZoneId: 'Asia/Seoul',
      state: '서울특별시',
      country: '대한민국',
      fullName: '서울특별시, 대한민국',
    },
    hour: null,
    min: null,
    month: 4,
    name: '이승환_Martin2',
    day: 9,
  },
};

describe('user-api', () => {
  describe('getMe', () => {
    it('고정 경로 호출 + 봉투 언랩 + 핵심 필드만 매핑한다', async () => {
      const get = jest.fn().mockResolvedValue(meEnvelope);
      const api = createUserApi({ get } as unknown as HttpClient);

      const user = await api.getMe();

      expect(get).toHaveBeenCalledWith('/api/users/me');
      expect(user).toEqual({
        id: 8387785,
        name: '이승환_Martin2',
        email: '102745447751092147672#google',
        avatarURL: null,
        isGuest: false,
      });
    });

    it('빈 문자열 email/avatarURL은 null로 정규화한다', async () => {
      const get = jest.fn().mockResolvedValue({
        status: 200,
        data: { id: 1, name: 'n', email: '', avatarURL: '', isGuest: true },
      });
      const api = createUserApi({ get } as unknown as HttpClient);

      const user = await api.getMe();

      expect(user.email).toBeNull();
      expect(user.avatarURL).toBeNull();
      expect(user.isGuest).toBe(true);
    });
  });

  describe('getProfile', () => {
    it('고정 경로 호출 + 봉투 언랩 + city는 name/fullName/timeZoneId만 추린다', async () => {
      const get = jest.fn().mockResolvedValue(profileEnvelope);
      const api = createUserApi({ get } as unknown as HttpClient);

      const profile = await api.getProfile();

      expect(get).toHaveBeenCalledWith('/api/users/me/profile');
      expect(profile).toEqual({
        name: '이승환_Martin2',
        gender: 'M',
        calendar: 'S',
        year: 1987,
        month: 4,
        day: 9,
        hour: null,
        min: null,
        city: {
          name: '서울특별시',
          fullName: '서울특별시, 대한민국',
          timeZoneId: 'Asia/Seoul',
        },
      });
    });

    it('city가 null이면 null, hour/min의 number 값은 보존한다', async () => {
      const get = jest.fn().mockResolvedValue({
        status: 200,
        data: {
          name: 'n',
          gender: 'F',
          calendar: 'L',
          year: 2000,
          month: 1,
          day: 2,
          hour: 13,
          min: 30,
          city: null,
        },
      });
      const api = createUserApi({ get } as unknown as HttpClient);

      const profile = await api.getProfile();

      expect(profile.city).toBeNull();
      expect(profile.hour).toBe(13);
      expect(profile.min).toBe(30);
    });
  });

  describe('invalidate', () => {
    it('회원탈퇴 경로로 POST하고 body는 사용하지 않는다', async () => {
      const post = jest.fn().mockResolvedValue(undefined);
      const api = createUserApi({ post } as unknown as HttpClient);

      await expect(api.invalidate()).resolves.toBeUndefined();
      expect(post).toHaveBeenCalledWith('/api/users/me/invalidate');
    });
  });
});
