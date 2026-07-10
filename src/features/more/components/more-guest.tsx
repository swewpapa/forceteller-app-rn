import { StyleSheet } from 'react-native';
import { Button, Column, ScreenContainer, Typography } from '@/shared/components';
import { useAppNavigation } from '@/features/auth';

/**
 * More 게스트 상태 — 로그인 진입점(홈에서 이 자리로 이동).
 * 로그인 성공 시 auth-store status가 authenticated로 바뀌면 프로필 화면으로 전환된다.
 */
export function MoreGuest() {
  const navigation = useAppNavigation();
  return (
    <ScreenContainer>
      <Column align="center" justify="center" gap="300" style={styles.body}>
        <Typography variant="headline-sm" style={styles.title}>
          로그인하고 더 많은{'\n'}기능을 이용하세요
        </Typography>
        <Button
          appearance="outline"
          size="lg"
          fullWidth
          label="로그인"
          onPress={() => navigation.navigate('Login')}
        />
      </Column>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, paddingHorizontal: 24 },
  title: { textAlign: 'center' },
});
