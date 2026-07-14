import { Image, ScrollView, StyleSheet } from 'react-native';
import {
  Button,
  Column,
  Row,
  ScreenContainer,
  StandardAppBar,
  Typography,
} from '@/shared/components';
import { spacing } from '@/shared/theme';
import { useAppNavigation } from '@/features/auth';
import { useMoreList } from '../hooks/useMoreList';
import { ShortcutGrid, type Shortcut } from './shortcut-grid';

// 포스텔러 BI 심볼(Figma 82:7107 bi_symbol). 브랜드 워드마크용(앱 바 로고는 StandardAppBar 소유).
const LOGO = require('../../../assets/forceteller-logo.png');

/**
 * More 게스트 상태 — web /section/more 게스트 구성 반영:
 * 앱 바(Root) + 브랜드(로고+워드마크) + 로그인/회원가입 CTA + 숏컷 그리드(탭→로그인).
 * 앱 바/숏컷 모두 게스트는 로그인 유도(web 동일).
 * (하단 "충전 2배" 프로모 이미지 배너=원격 에셋 → 후속.)
 */
export function MoreGuest() {
  const navigation = useAppNavigation();
  const goLogin = () => navigation.navigate('Login');

  // 숏컷은 서버 드리븐(/api/more/list). 게스트는 전 항목이 로그인 유도(web 동일).
  const { data: moreItems } = useMoreList();
  const shortcuts: Shortcut[] = (moreItems ?? []).map((it) => ({
    key: String(it.id),
    label: it.name,
    iconUrl: it.iconUrl,
    onPress: goLogin,
  }));

  return (
    <ScreenContainer>
      {/* 게스트: 앱 바 액션도 전부 로그인 유도. */}
      <StandardAppBar onPressAction={goLogin} onPressLogo={goLogin} />
      <ScrollView contentContainerStyle={styles.content}>
        <Column align="center" gap="100" style={styles.brand}>
          <Row align="center" gap="100">
            <Image source={LOGO} style={styles.logo} resizeMode="contain" />
            <Typography variant="headline-md">포스텔러</Typography>
          </Row>
          <Typography variant="body-md" color="subtle">
            포스텔러에 로그인해주세요
          </Typography>
        </Column>

        <Button
          label="로그인 / 회원가입"
          color="primary"
          appearance="solid"
          size="lg"
          fullWidth
          onPress={goLogin}
        />

        <ShortcutGrid items={shortcuts} style={styles.grid} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40, gap: spacing[350] },
  brand: { marginTop: 8 },
  logo: { width: 32, height: 32 },
  grid: { marginTop: 4 },
});
