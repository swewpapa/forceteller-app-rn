import { useCallback, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native'; // eslint-disable-line no-restricted-imports
import { Button, Column, ScreenContainer } from '@/shared/components';
import { useAppColors } from '@/shared/theme';
import { useAuthStore } from '@/features/auth';
import { navigateUnsafe } from '../navigation/navigate-unsafe';

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
      if (redirect) navigateUnsafe(navigation, redirect.screen, redirect.params);
      else navigation.goBack();
    } catch {
      // 로그인 실패/취소: 모달 유지 (Task 12에서 에러 토스트 검토)
    } finally {
      setLoading(false);
    }
  }, [signIn, route.params, navigation]);

  return (
    <ScreenContainer>
      <Column padding="300" gap="300" justify="center" style={styles.body}>
        <Text style={[styles.title, { color: colors.text.default }]}>로그인</Text>
        <Button
          appearance="outline"
          size="lg"
          fullWidth
          loading={loading}
          label="Google로 계속하기"
          onPress={onGoogle}
        />
      </Column>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1 },
  title: { fontSize: 24, fontWeight: '700', textAlign: 'center' },
});
