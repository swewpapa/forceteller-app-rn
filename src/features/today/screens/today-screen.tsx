import { useRef } from 'react';
import { ActivityIndicator, Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppNavigation } from '@/features/auth';
import { useFreeForceTip } from '@/features/freeforce';
import {
  AppBar,
  APP_BAR_HEIGHT,
  AppBarCalendarButton,
  AppBarEventButton,
  AppBarFreeForceButton,
  AppBarSearchButton,
  Button,
  Column,
  Popover,
  ScreenContainer,
  Typography,
} from '@/shared/components';
import { useAppColors } from '@/shared/theme';
import { TodayHeroView } from '@/features/today/components/today-hero-view';
import { TodayPostView } from '@/features/today/components/today-post-view';
import { useTodayHero } from '@/features/today/hooks/useTodayHero';
import { useTodayPosts } from '@/features/today/hooks/useTodayPosts';
import type { TodayLink } from '@/features/today/types/today-types';

const HERO_HEIGHT = 480;

/**
 * 투데이 탭(RN). 히어로가 있으면 히어로 위 스크롤 반응 앱 바(투명+날짜+흰아이콘 →
 * 스크롤 시 솔리드+BI+진한아이콘 크로스페이드), 없으면 솔리드 앱 바 + 피드.
 */
export function TodayScreen() {
  const navigation = useAppNavigation();
  const insets = useSafeAreaInsets();
  const colors = useAppColors();
  const heroQuery = useTodayHero();
  const postsQuery = useTodayPosts();
  const showFreeForceTip = useFreeForceTip();
  const scrollY = useRef(new Animated.Value(0)).current;

  const handlePressLink = (link: TodayLink) => {
    // premium과 동일한 Web 라우트. api 링크는 이 화면 스코프 밖.
    if (link.type === 'url') {
      navigation.navigate('Web', { path: link.value });
    }
  };
  const goFreeForce = () => navigation.navigate('Web', { path: '/freeforce' });
  // 로딩/에러/히어로/오버레이 모든 상태가 같은 액션 세트를 쓴다. 색은 각 AppBar의
  // iconColor(context)가 하위 named 버튼에 전파하므로 한 함수로 재사용한다.
  // freeforce 툴팁(Popover)은 앵커 중복 register를 막으려 인터랙션 레이어(withTip)에만 단다.
  const buildTrailing = (withTip: boolean) => (
    <>
      <AppBarSearchButton onPress={() => {}} />
      {withTip ? (
        <Popover id="freeforce" visible={showFreeForceTip} message="무료 포스 받기">
          <AppBarFreeForceButton onPress={goFreeForce} />
        </Popover>
      ) : (
        <AppBarFreeForceButton onPress={goFreeForce} />
      )}
      <AppBarEventButton onPress={() => {}} />
      <AppBarCalendarButton onPress={() => navigation.navigate('Web', { path: '/cal' })} />
    </>
  );

  if (postsQuery.isPending) {
    return (
      <ScreenContainer>
        <AppBar trailing={buildTrailing(true)} />
        <ActivityIndicator />
      </ScreenContainer>
    );
  }
  if (postsQuery.isError) {
    return (
      <ScreenContainer>
        <AppBar trailing={buildTrailing(true)} />
        <Column padding="300" gap="150">
          <Typography variant="body-md" color="subtle">
            투데이를 불러오지 못했어요.
          </Typography>
          <Button
            label="다시 시도"
            color="secondary"
            appearance="outline"
            size="sm"
            onPress={() => postsQuery.refetch()}
          />
        </Column>
      </ScreenContainer>
    );
  }

  const hero = heroQuery.data ?? null;
  const feed = (
    <Column padding="300" gap="300">
      {postsQuery.data.map((post) => (
        <TodayPostView key={post.id} post={post} onPressLink={handlePressLink} />
      ))}
    </Column>
  );

  // 히어로 없음 → 스크롤 반응 불필요, 솔리드 앱 바 + 피드.
  if (!hero) {
    return (
      <ScreenContainer>
        <AppBar trailing={buildTrailing(true)} />
        <Animated.ScrollView>{feed}</Animated.ScrollView>
      </ScreenContainer>
    );
  }

  // 히어로 있음 → 풀블리드 + 스크롤 반응 헤더.
  const threshold = Math.max(HERO_HEIGHT - insets.top - APP_BAR_HEIGHT, 1);
  const solidOpacity = scrollY.interpolate({
    inputRange: [0, threshold],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const topOpacity = scrollY.interpolate({
    inputRange: [0, threshold],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.fill, { backgroundColor: colors.background.surface }]}>
      <Animated.ScrollView
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
        })}
      >
        <TodayHeroView hero={hero} onPressLink={handlePressLink} />
        {feed}
      </Animated.ScrollView>

      {/* 스크롤 반응 오버레이 헤더 — 솔리드(시각 전용) 위에 투명(탭 처리)을 크로스페이드. */}
      <View
        style={[styles.header, { height: insets.top + APP_BAR_HEIGHT }]}
        pointerEvents="box-none"
      >
        <Animated.View
          style={[StyleSheet.absoluteFill, { opacity: solidOpacity }]}
          pointerEvents="none"
        >
          <View style={{ paddingTop: insets.top, backgroundColor: colors.background.surface }}>
            <AppBar background="transparent" trailing={buildTrailing(false)} />
          </View>
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: topOpacity }]}>
          <View style={{ paddingTop: insets.top }}>
            <AppBar
              background="transparent"
              iconColor={hero.iconColor}
              leading={<Text style={[styles.date, { color: hero.iconColor }]}>{hero.date}</Text>}
              trailing={buildTrailing(true)}
            />
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  header: { position: 'absolute', top: 0, left: 0, right: 0 },
  date: { fontSize: 16, fontWeight: '700', letterSpacing: -0.32, paddingLeft: 12 },
});
