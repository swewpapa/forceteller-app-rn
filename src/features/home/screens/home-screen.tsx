import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppNavigation, useAuthStore } from '@/features/auth';
import { ScreenContainer, Typography } from '@/shared/components';
import { spacing, useAppColors } from '@/shared/theme';

/** 홈 탭(RN). 예시로 상세 페이지(WebView) 진입 버튼을 둔다. */
export function HomeScreen() {
  const navigation = useAppNavigation();
  const colors = useAppColors();
  const status = useAuthStore(s => s.status);
  const signOut = useAuthStore(s => s.signOut);

  return (
    <ScreenContainer>
      <View style={styles.body}>
        <Text style={[styles.title, { color: colors.text.default }]}>홈</Text>

        {status === 'authenticated' ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              // 로그아웃 실패는 무시(상태 유지)
              signOut().catch(() => undefined);
            }}
            style={[styles.link, { borderColor: colors.stroke.subtle }]}
          >
            <Typography variant="body-md">로그아웃</Typography>
          </Pressable>
        ) : (
          <Pressable
            accessibilityRole="button"
            disabled={status === 'loading'}
            onPress={() => navigation.navigate('Login')}
            style={[styles.link, { borderColor: colors.stroke.subtle }]}
          >
            <Typography variant="body-md">
              {status === 'loading' ? '...' : '로그인'}
            </Typography>
          </Pressable>
        )}

        <Pressable
          accessibilityRole="button"
          onPress={() =>
            navigation.navigate('Web', {
              path: '/premium/2284',
              title: '상세',
            })
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
            navigation.navigate('Web', {
              path: '/item/4053',
              title: '상세',
            })
          }
          style={[styles.link, { borderColor: colors.stroke.subtle }]}
        >
          <Text style={[styles.linkText, { color: colors.text.default }]}>
            상세 페이지 열기 (WebView)
          </Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, padding: spacing[300], gap: spacing[300] },
  title: { fontSize: 24, fontWeight: '700' },
  link: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: spacing[100],
    paddingHorizontal: spacing[300],
    alignItems: 'center',
  },
  linkText: { fontSize: 15, fontWeight: '500' },
});
