import { useMemo, type PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppColors, type ModeColors } from '@/shared/theme';
import { PopoverProvider } from './popover/popover-context';
import { PopoverHost } from './popover/popover-host';

/**
 * Base screen wrapper: top safe-area inset + scheme-aware background.
 * bottom inset은 탭바(TabBar)가 처리하므로 top만 적용한다.
 * React Navigation 권장에 따라 SafeAreaView 대신 useSafeAreaInsets를 사용한다.
 */
export function ScreenContainer({ children }: PropsWithChildren) {
  const colors = useAppColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <PopoverProvider>
        {children}
        <PopoverHost />
      </PopoverProvider>
    </View>
  );
}

function makeStyles(colors: ModeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background.surface,
    },
  });
}
