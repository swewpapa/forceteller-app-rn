import { ActivityIndicator, ScrollView } from 'react-native';
import { useAppNavigation } from '@/features/auth';
import { useFreeForceTip } from '@/features/freeforce';
import {
  AppBar,
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
import { PremiumWidget } from '@/features/premium/components/premium-widget';
import { PremiumSubjects } from '@/features/premium/components/premium-subjects';
import { usePremiumList } from '@/features/premium/hooks/usePremiumList';
import { usePremiumSubjects } from '@/features/premium/hooks/usePremiumSubjects';
import type { PremiumLink, PremiumSubjectLink } from '@/features/premium/types/premium-types';

/**
 * 프리미엄 탭(RN). 상단 표준 앱 바 + 서버드리븐 위젯 리스트(usePremiumList).
 * 앱 바는 로딩/에러/정상 모든 상태에서 유지되도록 body만 분기한다.
 */
export function PremiumScreen() {
  const navigation = useAppNavigation();
  const query = usePremiumList();
  const subjectsQuery = usePremiumSubjects();
  const showFreeForceTip = useFreeForceTip();

  // 카테고리 링크: value + queryParams(genre id / keyword)를 쿼리스트링으로 붙여 Web 네비.
  const handleSubjectLink = (link: PremiumSubjectLink) => {
    const qp = link.params?.queryParams as Record<string, unknown> | undefined;
    const qs = qp
      ? '?' +
        Object.entries(qp)
          .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
          .join('&')
      : '';
    navigation.navigate('Web', { path: `${link.value}${qs}` });
  };
  const handleViewAll = (segment: 'genre' | 'subject') => {
    navigation.navigate('Web', {
      path: segment === 'genre' ? '/premium/subjects/genres' : '/premium/subjects/keywords',
    });
  };

  const handlePressLink = (link: PremiumLink) => {
    switch (link.type) {
      case 'url':
        // home과 동일한 Web 라우트. WebRouteParams.title은 optional이라
        // 위젯 콜백이 link만 넘기는 premium에선 생략한다(title을 지어내지 않음).
        navigation.navigate('Web', { path: link.value });
        return;
      case 'api':
        // tag keyword(api) 필터의 네비 목적지가 아직 없어 범위 밖 — no-op.
        return;
      default: {
        const _exhaustive: never = link;
        return _exhaustive;
      }
    }
  };

  return (
    <ScreenContainer>
      <AppBar
        trailing={
          <>
            <AppBarSearchButton onPress={() => {}} />
            <Popover id="freeforce" visible={showFreeForceTip} message="무료 포스 받기">
              <AppBarFreeForceButton
                onPress={() => navigation.navigate('Web', { path: '/freeforce' })}
              />
            </Popover>
            <AppBarEventButton onPress={() => {}} />
            <AppBarCalendarButton onPress={() => navigation.navigate('Web', { path: '/cal' })} />
          </>
        }
      />
      {query.isPending ? (
        <ActivityIndicator />
      ) : query.isError ? (
        <Column padding="300" gap="150">
          <Typography variant="body-md" color="subtle">
            프리미엄을 불러오지 못했어요.
          </Typography>
          <Button
            label="다시 시도"
            color="secondary"
            appearance="outline"
            size="sm"
            onPress={() => query.refetch()}
          />
        </Column>
      ) : (
        <ScrollView>
          {subjectsQuery.data ? (
            <PremiumSubjects
              subjects={subjectsQuery.data}
              onPressItem={handleSubjectLink}
              onPressViewAll={handleViewAll}
            />
          ) : null}
          <Column padding="300" gap="300">
            {query.data.map((premium) => (
              <PremiumWidget key={premium.id} premium={premium} onPressLink={handlePressLink} />
            ))}
          </Column>
        </ScrollView>
      )}
    </ScreenContainer>
  );
}
