import { http, type HttpClient } from '@/shared/lib';
import type { AuthUser, UserProfile } from '../types/user-types';
import {
  normalizeMe,
  normalizeProfile,
  type UserMeResponse,
  type UserProfileResponse,
} from './normalize-user';

/**
 * 로그인 사용자(me/profile) 조회 API. auth-api와 같은 auth feature 내에서 파일만 분리한다.
 * client.get은 {status, data} 봉투 전체를 반환하고(premium 선례), 언랩은 normalize가 담당.
 */
export function createUserApi(client: HttpClient) {
  return {
    /** GET /api/users/me — 로그인 사용자 기본 정보. */
    getMe: async (): Promise<AuthUser> =>
      normalizeMe(await client.get<UserMeResponse>('/api/users/me')),

    /** GET /api/users/me/profile — 사주 프로필(생년월일시 + 출생지). */
    getProfile: async (): Promise<UserProfile> =>
      normalizeProfile(await client.get<UserProfileResponse>('/api/users/me/profile')),

    /** POST /api/users/me/invalidate — 회원탈퇴. 응답 body는 사용하지 않는다. */
    invalidate: (): Promise<void> => client.post<void>('/api/users/me/invalidate'),
  };
}

export const userApi = createUserApi(http);
