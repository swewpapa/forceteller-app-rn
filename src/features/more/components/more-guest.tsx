import { Image, ScrollView, StyleSheet } from 'react-native';
import { faTable } from '@fortawesome/pro-solid-svg-icons/faTable';
import { faCalendarDays } from '@fortawesome/pro-solid-svg-icons/faCalendarDays';
import { faBell } from '@fortawesome/pro-solid-svg-icons/faBell';
import { faBook } from '@fortawesome/pro-solid-svg-icons/faBook';
import { faFlask } from '@fortawesome/pro-solid-svg-icons/faFlask';
import { faGift } from '@fortawesome/pro-solid-svg-icons/faGift';
import { faTicket } from '@fortawesome/pro-solid-svg-icons/faTicket';
import { faSackDollar } from '@fortawesome/pro-solid-svg-icons/faSackDollar';
import { faCreditCard } from '@fortawesome/pro-solid-svg-icons/faCreditCard';
import { faCoins } from '@fortawesome/pro-solid-svg-icons/faCoins';
import { faHeadset } from '@fortawesome/pro-solid-svg-icons/faHeadset';
import { faGear } from '@fortawesome/pro-solid-svg-icons/faGear';
import { Button, Column, Row, ScreenContainer, Typography } from '@/shared/components';
import { spacing } from '@/shared/theme';
import { useAppNavigation } from '@/features/auth';
import { ShortcutGrid, type Shortcut } from './shortcut-grid';

// 포스텔러 BI 심볼(Figma Component Library 82:7107 "Button App Bar Slot" / bi_symbol, 768²).
const LOGO = require('../../../assets/forceteller-logo.png');

/**
 * More 게스트 상태 — web /section/more 게스트 구성 반영:
 * 브랜드(로고+워드마크) + 로그인/회원가입 CTA + 숏컷 그리드(탭→로그인).
 * (상단 아이콘바=앱 전역 chrome, 하단 "충전 2배" 프로모 이미지 배너=원격 에셋 → 후속.)
 */
export function MoreGuest() {
  const navigation = useAppNavigation();
  const goLogin = () => navigation.navigate('Login');

  // 게스트는 모든 항목이 로그인 유도(web 동일). 아이콘은 FA Pro 근사(실 에셋 교체 여지).
  const shortcuts: Shortcut[] = [
    { key: 'saju', label: '내 사주 명식', icon: faTable, onPress: goLogin },
    { key: 'calendar', label: '운세 캘린더', icon: faCalendarDays, onPress: goLogin },
    { key: 'noti', label: '알림함', icon: faBell, onPress: goLogin },
    { key: 'fatebook', label: '마이 페이트북', icon: faBook, onPress: goLogin },
    { key: 'test', label: '테스트', icon: faFlask, onPress: goLogin },
    { key: 'gift', label: '선물함', icon: faGift, onPress: goLogin },
    { key: 'coupon', label: '쿠폰 등록', icon: faTicket, onPress: goLogin },
    { key: 'paidFee', label: '내가 낸 복채', icon: faSackDollar, onPress: goLogin },
    { key: 'luckCard', label: '내 행운 카드', icon: faCreditCard, onPress: goLogin },
    { key: 'freeCharge', label: '무료 충전', icon: faCoins, onPress: goLogin },
    { key: 'support', label: '고객센터', icon: faHeadset, onPress: goLogin },
    { key: 'settings', label: '앱 설정', icon: faGear, onPress: goLogin },
  ];

  return (
    <ScreenContainer>
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
