import { PlaceholderScreen } from '@/shared/components';
import { useTodayStore } from '../stores/today-store';

export function TodayScreen() {
  const selectedSign = useTodayStore(state => state.selectedSign);

  return (
    <PlaceholderScreen
      title="투데이"
      subtitle={`선택된 별자리: ${selectedSign}`}
    />
  );
}
