import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { useAppNavigation } from '@/features/auth';
import { ThemeWidgetListByCode, type ThemeView } from '@/features/theme';
import { Column, ScreenContainer } from '@/shared/components';
import { radius, spacing, useAppColors } from '@/shared/theme';

/** 홈 탭(RN). 테마 위젯 3개 리전(recommend_top/middle/bottom) + 예시 진입 버튼들. */
const THEME_CODES = ['recommend_top', 'recommend_middle', 'recommend_bottom'] as const;

export function HomeScreen() {
  const navigation = useAppNavigation();
  const colors = useAppColors();

  const handlePressView = (view: ThemeView) => {
    // tag_filter 링크는 keyword_cloud 사이클에서 처리 (text_only에는 url만 관측됨)
    if (view.link.type === 'url') {
      navigation.navigate('Web', { path: view.link.value, title: view.title });
    }
  };

  return (
    <ScreenContainer>
      <ScrollView>
        <Column padding="300" gap="300">
          <Text style={[styles.title, { color: colors.text.default }]}>홈</Text>

          <Pressable
            accessibilityRole="button"
            onPress={() =>
              navigation.navigate('Web', { path: '/premium/2284', title: '상세' })
            }
            style={[styles.link, { borderColor: colors.stroke.subtle }]}
          >
            <Text style={[styles.linkText, { color: colors.text.default }]}>
              상세 페이지 열기 (WebView)
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() =>
              navigation.navigate('Web', { path: '/item/4053', title: '상세' })
            }
            style={[styles.link, { borderColor: colors.stroke.subtle }]}
          >
            <Text style={[styles.linkText, { color: colors.text.default }]}>
              상세 페이지 열기 (WebView)
            </Text>
          </Pressable>

          {THEME_CODES.map(code => (
            <ThemeWidgetListByCode key={code} code={code} onPressView={handlePressView} />
          ))}
        </Column>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '700' },
  link: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: spacing[100],
    paddingHorizontal: spacing[300],
    alignItems: 'center',
  },
  linkText: { fontSize: 15, fontWeight: '500' },
});
