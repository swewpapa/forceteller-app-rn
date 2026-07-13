import { ActivityIndicator, Linking, ScrollView, StyleSheet } from 'react-native';
import { Button, Column, ScreenContainer } from '@/shared/components';
import { useAppNavigation, useAuthStore } from '@/features/auth';
import { useMe, useProfile, getZodiacName, getConstellation, formatBirth } from '@/features/user';
import { ProfileHeader } from '../components/profile-header';
import { SajuPill } from '../components/saju-pill';
import { ForceCard } from '../components/force-card';
import { ShortcutGrid, type Shortcut } from '../components/shortcut-grid';
import { MoreFooter } from '../components/more-footer';
import { MoreGuest } from '../components/more-guest';
import { useMoreList } from '../hooks/useMoreList';
import type { MoreShortcutLink } from '../types/more-types';

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

/** 숏컷 링크 열기: 내부 SPA path는 Web 라우트, 외부 절대 URL은 시스템 브라우저. */
function openMoreLink(
  navigation: ReturnType<typeof useAppNavigation>,
  link: MoreShortcutLink,
  title: string,
) {
  if (/^https?:\/\//i.test(link.value)) {
    Linking.openURL(link.value).catch(() => undefined);
  } else {
    navigation.navigate('Web', { path: link.value, title });
  }
}

/** 더 보기(마이페이지). 게스트=로그인 CTA / 로그인=프로필(useMe·useProfile 실데이터 + 일부 placeholder). */
export function MoreScreen() {
  const status = useAuthStore((s) => s.status);
  const signOut = useAuthStore((s) => s.signOut);
  const navigation = useAppNavigation();
  const me = useMe();
  const profile = useProfile();
  const { data: moreItems } = useMoreList();

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
  // 숏컷은 서버 드리븐(/api/more/list). 로그인 상태는 각 항목 링크로 네비.
  const shortcuts: Shortcut[] = (moreItems ?? []).map((it) => ({
    key: String(it.id),
    label: it.name,
    iconUrl: it.iconUrl,
    onPress: () => openMoreLink(navigation, it.link, it.name),
  }));

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
        {/* dev 전용 QA 로그아웃(정식 로그아웃 UI 신설 전 임시). prod 번들 미포함. */}
        {__DEV__ ? (
          <Button
            label="로그아웃 (dev QA)"
            appearance="outline"
            size="sm"
            onPress={() => {
              signOut().catch(() => undefined);
            }}
            style={styles.devLogout}
          />
        ) : null}
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
  devLogout: { marginTop: 24, alignSelf: 'center' },
});
