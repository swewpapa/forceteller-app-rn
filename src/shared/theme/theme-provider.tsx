import {
  createContext,
  useCallback,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { useColorScheme } from 'react-native';
import { createMMKV } from 'react-native-mmkv';
import { dayColors, nightColors, type ModeColors } from './generated/mode-colors';
import { resolveTheme, type ResolvedTheme, type ThemeMode } from './resolve-theme';
import { createThemeStorage } from './theme-storage';

export type ThemeContextValue = {
  colors: ModeColors;
  mode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);

const storage = createThemeStorage(createMMKV({ id: 'theme' }));

export function ThemeProvider({ children }: PropsWithChildren) {
  // MMKV는 동기 읽기라 초기 렌더부터 저장된 모드가 반영된다(하이드레이션 불일치 없음).
  const [mode, setModeState] = useState<ThemeMode>(() => storage.getMode());
  const osScheme = useColorScheme();
  const resolvedTheme = resolveTheme(mode, osScheme);

  const setMode = useCallback((next: ThemeMode) => {
    storage.setMode(next);
    setModeState(next);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      colors: resolvedTheme === 'night' ? nightColors : dayColors,
      mode,
      resolvedTheme,
      setMode,
    }),
    [mode, resolvedTheme, setMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
