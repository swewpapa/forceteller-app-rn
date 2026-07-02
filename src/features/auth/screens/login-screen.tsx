import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native'; // eslint-disable-line no-restricted-imports
import { ScreenContainer } from '@/shared/components';
import { spacing, useAppColors } from '@/shared/theme';
import { useAuthStore } from '../stores/auth-store';

type LoginRoute = RouteProp<{ Login: { redirect?: { screen: string; params?: object } } }, 'Login'>;

export function LoginScreen() {
  const navigation = useNavigation();
  const route = useRoute<LoginRoute>();
  const colors = useAppColors();
  const signIn = useAuthStore((s) => s.signIn);
  const [loading, setLoading] = useState(false);

  const onGoogle = useCallback(async () => {
    setLoading(true);
    try {
      await signIn();
      const redirect = route.params?.redirect;
      if (redirect)
        // navigate의 rest-param 오버로드는 RouteName이 union일 때 두 인자를 [never,never]로 추론해
        // 타입 안전 캐스트가 불가능하다. Task 7과 동일하게 navigation을 any로 캐스트한다.
         
        (navigation as any).navigate(redirect.screen, redirect.params);
      else navigation.goBack();
    } catch {
      // 로그인 실패/취소: 모달 유지 (Task 12에서 에러 토스트 검토)
    } finally {
      setLoading(false);
    }
  }, [signIn, route.params, navigation]);

  return (
    <ScreenContainer>
      <View style={styles.body}>
        <Text style={[styles.title, { color: colors.text.default }]}>로그인</Text>
        <Pressable accessibilityRole="button" onPress={onGoogle} disabled={loading} style={[styles.btn, { borderColor: colors.stroke.subtle }]}>
          {loading ? <ActivityIndicator color={colors.text.default} /> : <Text style={[styles.btnText, { color: colors.text.default }]}>Google로 계속하기</Text>}
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, padding: spacing.lg, gap: spacing.lg, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '700', textAlign: 'center' },
  btn: { borderWidth: 1, borderRadius: 8, paddingVertical: spacing.md, alignItems: 'center' },
  btnText: { fontSize: 15, fontWeight: '500' },
});
