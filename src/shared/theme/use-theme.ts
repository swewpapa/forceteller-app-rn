import { useContext } from 'react';
import type { SemanticColors } from './generated/colors';
import { ThemeContext, type ThemeContextValue } from './theme-provider';

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (ctx === null) {
    throw new Error('useTheme must be used within <ThemeProvider>');
  }
  return ctx;
}

/** 시맨틱 컬러만 필요한 컴포넌트용 편의 훅 (기존 useAppColors 계약 계승). */
export function useAppColors(): SemanticColors {
  return useTheme().colors;
}
