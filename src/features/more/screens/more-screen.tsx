import { ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { faTable } from '@fortawesome/pro-solid-svg-icons/faTable';
import { faCalendarDays } from '@fortawesome/pro-solid-svg-icons/faCalendarDays';
import { faBell } from '@fortawesome/pro-solid-svg-icons/faBell';
import { faBook } from '@fortawesome/pro-solid-svg-icons/faBook';
import { faBullhorn } from '@fortawesome/pro-solid-svg-icons/faBullhorn';
import { faTicket } from '@fortawesome/pro-solid-svg-icons/faTicket';
import { faSackDollar } from '@fortawesome/pro-solid-svg-icons/faSackDollar';
import { faCreditCard } from '@fortawesome/pro-solid-svg-icons/faCreditCard';
import { faCoins } from '@fortawesome/pro-solid-svg-icons/faCoins';
import { faGift } from '@fortawesome/pro-solid-svg-icons/faGift';
import { faHeadset } from '@fortawesome/pro-solid-svg-icons/faHeadset';
import { faGear } from '@fortawesome/pro-solid-svg-icons/faGear';
import { Column, ScreenContainer } from '@/shared/components';
import { useAuthStore } from '@/features/auth';
import { useMe, useProfile, getZodiacName, getConstellation, formatBirth } from '@/features/user';
import { ProfileHeader } from '../components/profile-header';
import { SajuPill } from '../components/saju-pill';
import { ForceCard } from '../components/force-card';
import { ShortcutGrid, type Shortcut } from '../components/shortcut-grid';
import { MoreFooter } from '../components/more-footer';
import { MoreGuest } from '../components/more-guest';

// TODO(실데이터): 소스 부재로 placeholder 유지(Martin 합의) —
//  · dayAnimal(일주동물): 서버 간지(a/e/h/i/s/z) normalize 확장 필요
//  · uid: 도메인 미노출(useMe.id는 숫자)
//  · force/bonusForce: 잔액 엔드포인트 미구현
const PLACEHOLDER = {
  dayAnimal: '황금 뱀',
  uid: '101241290217370492162#google',
  force: 197,
  bonusForce: 4749,
};

/** 더 보기(마이페이지). 게스트=로그인 CTA / 로그인=프로필(useMe·useProfile 실데이터 + 일부 placeholder). */
export function MoreScreen() {
  const status = useAuthStore((s) => s.status);
  const signOut = useAuthStore((s) => s.signOut);
  const me = useMe();
  const profile = useProfile();

  if (status !== 'authenticated') {
    return <MoreGuest />;
  }

  if (me.isLoading || profile.isLoading) {
    return (
      <ScreenContainer>
        <Column align="center" justify="center" style={styles.loading}>
          <ActivityIndicator />
        </Column>
      </ScreenContainer>
    );
  }

  const p = profile.data;
  const shortcuts: Shortcut[] = [
    { key: 'saju', label: '내 사주명식', icon: faTable, disabled: true },
    { key: 'calendar', label: '운세 캘린더', icon: faCalendarDays },
    { key: 'noti', label: '알림함', icon: faBell },
    { key: 'fatebook', label: '마이 페이트북', icon: faBook },
    { key: 'notice', label: '공지사항', icon: faBullhorn },
    { key: 'coupon', label: '쿠폰', icon: faTicket },
    { key: 'paidFee', label: '내가 낸 복채', icon: faSackDollar },
    { key: 'luckCard', label: '내 행운카드', icon: faCreditCard },
    { key: 'freeCharge', label: '무료 충전', icon: faCoins },
    { key: 'gift', label: '선물함', icon: faGift },
    { key: 'support', label: '고객센터', icon: faHeadset },
    // TODO: 앱 설정 화면 신설 시 그리로. 현재는 QA용 임시 로그아웃 진입.
    {
      key: 'settings',
      label: '앱 설정',
      icon: faGear,
      onPress: () => {
        signOut().catch(() => undefined);
      },
    },
  ];

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content}>
        <ProfileHeader
          nickname={me.data?.name ?? ''}
          avatarURL={me.data?.avatarURL ?? null}
          dayAnimal={PLACEHOLDER.dayAnimal}
          uid={PLACEHOLDER.uid}
        />
        <SajuPill
          birth={p ? formatBirth(p) : ''}
          zodiacAnimal={p ? getZodiacName(p.year) : ''}
          zodiacSign={p ? getConstellation(p.month, p.day) : ''}
          style={styles.pill}
        />
        <ForceCard force={PLACEHOLDER.force} bonusForce={PLACEHOLDER.bonusForce} style={styles.card} />
        <ShortcutGrid items={shortcuts} style={styles.grid} />
        <MoreFooter style={styles.footer} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  loading: { flex: 1 },
  pill: { marginTop: 24 },
  card: { marginTop: 12 },
  grid: { marginTop: 28 },
  footer: { marginTop: 40 },
});
