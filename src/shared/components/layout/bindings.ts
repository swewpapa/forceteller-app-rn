import { align, background, gap, justify, margin, padding, radius } from '@/shared/lib/style-engine';

/** Box 바인딩 — 시각 컨테이너(배경/패딩/radius). alias는 축약 먼저·풀네임 나중(뒤 선언이 Object.assign으로 이김). */
export const boxResolvers = { p: padding, padding, m: margin, margin, color: background, radius };

/** Row/Column 공유 — boxResolvers + 나열 축(gap/정렬). base flexDirection만 컴포넌트가 다르게 준다. */
export const flexResolvers = { ...boxResolvers, gap, justify, align };
