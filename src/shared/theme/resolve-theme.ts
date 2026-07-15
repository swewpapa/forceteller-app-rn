import type { ColorSchemeName } from 'react-native';

export type ThemeMode = 'system' | 'day' | 'night';
export type ResolvedTheme = 'day' | 'night';

// RN 0.85 기준 useColorScheme()의 실제 반환 타입은 `ColorSchemeName | null | undefined`
// (ColorSchemeName 자체는 null 미포함 'light'|'dark'|'unspecified' —
// react-native의 types_generated/.../NativeAppearance.d.ts가 tsc가 해석하는 정의).
type OsColorScheme = ColorSchemeName | null | undefined;

/** 사용자 모드와 OS 스킴(light/dark/unspecified/null/undefined)을 최종 테마로 확정한다. */
export function resolveTheme(mode: ThemeMode, osScheme: OsColorScheme): ResolvedTheme {
  if (mode === 'system') {
    return osScheme === 'dark' ? 'night' : 'day';
  }
  return mode;
}
