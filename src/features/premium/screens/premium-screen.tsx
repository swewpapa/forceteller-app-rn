import { ActivityIndicator, ScrollView } from 'react-native';
import { useAppNavigation } from '@/features/auth';
import { Button, Column, ScreenContainer, Typography } from '@/shared/components';
import { PremiumWidget } from '../components/premium-widget';
import { usePremiumList } from '../hooks/usePremiumList';
import type { PremiumLink } from '../types/premium-types';

/**
 * 프리미엄 탭(RN). 서버드리븐 위젯 리스트를 단일 쿼리(usePremiumList)로 렌더한다.
 * theme 홈의 3-리전과 달리 한 쿼리라 로딩/에러도 화면 단위로 처리한다.
 */
export function PremiumScreen() {
  const navigation = useAppNavigation();
  const query = usePremiumList();

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

  if (query.isPending) {
    return (
      <ScreenContainer>
        <ActivityIndicator />
      </ScreenContainer>
    );
  }
  if (query.isError) {
    return (
      <ScreenContainer>
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
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView>
        <Column padding="300" gap="300">
          {query.data.map(premium => (
            <PremiumWidget
              key={premium.id}
              premium={premium}
              onPressLink={handlePressLink}
            />
          ))}
        </Column>
      </ScrollView>
    </ScreenContainer>
  );
}
