import { ActivityIndicator, ScrollView } from 'react-native';
import { useAppNavigation } from '@/features/auth';
import { Button, Column, ScreenContainer, Typography } from '@/shared/components';
import { TodayPostView } from '../components/today-post-view';
import { useTodayPosts } from '../hooks/useTodayPosts';
import type { TodayLink } from '../types/today-types';

/**
 * 투데이 탭(RN). 서버드리븐 포스트 피드를 단일 쿼리(useTodayPosts)로 렌더한다.
 * premium 탭과 동일하게 한 쿼리라 로딩/에러도 화면 단위로 처리한다.
 */
export function TodayScreen() {
  const navigation = useAppNavigation();
  const query = useTodayPosts();

  const handlePressLink = (link: TodayLink) => {
    // TodayLink는 현재 url만이나 방어적으로 type 체크(비-url이 오면 무시).
    // premium과 동일한 Web 라우트. link.params는 도메인에 보존돼 있으나
    // Web 전달 방식은 후속(추후 상의) — 이번엔 path만 네비.
    if (link.type === 'url') {
      navigation.navigate('Web', { path: link.value });
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
            투데이를 불러오지 못했어요.
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
          {query.data.map(post => (
            <TodayPostView key={post.id} post={post} onPressLink={handlePressLink} />
          ))}
        </Column>
      </ScrollView>
    </ScreenContainer>
  );
}
