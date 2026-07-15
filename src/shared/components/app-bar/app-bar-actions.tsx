import { faMagnifyingGlass } from '@fortawesome/pro-light-svg-icons/faMagnifyingGlass';
import { faCalendarDays } from '@fortawesome/pro-light-svg-icons/faCalendarDays';
import { useAppColors } from '@/shared/theme';
import { AppBarButton } from './app-bar-button';
import { useAppBarIconColor } from './app-bar-context';
import { FreeForceIcon, EventIcon } from './app-bar-icons';

type ActionProps = {
  /** 목적지 네비게이션은 화면이 소유(가드가 게스트 리다이렉트 처리). */
  onPress?: () => void;
};

/**
 * 앱 바 표준 액션 버튼(예약 4종). 아이콘·badge·접근성 라벨을 내장하고,
 * SVG 아이콘 색은 AppBar iconColor(context)를 읽어 주입한다 — 화면은 onPress만 준다.
 * 표준 밖 액션·popover는 화면이 AppBarButton으로 직접 조합한다.
 */
export function AppBarSearchButton({ onPress }: ActionProps) {
  return <AppBarButton icon={faMagnifyingGlass} accessibilityLabel="검색" onPress={onPress} />;
}

export function AppBarCalendarButton({ onPress }: ActionProps) {
  return (
    <AppBarButton icon={faCalendarDays} badge accessibilityLabel="운세 캘린더" onPress={onPress} />
  );
}

export function AppBarFreeForceButton({ onPress }: ActionProps) {
  const colors = useAppColors();
  const color = useAppBarIconColor() ?? colors.text.default;
  return (
    <AppBarButton
      icon={<FreeForceIcon width={44} height={44} color={color} />}
      accessibilityLabel="무료 충전"
      onPress={onPress}
    />
  );
}

export function AppBarEventButton({ onPress }: ActionProps) {
  const colors = useAppColors();
  const color = useAppBarIconColor() ?? colors.text.default;
  return (
    <AppBarButton
      icon={<EventIcon width={27} height={26} color={color} />}
      badge
      accessibilityLabel="이벤트"
      onPress={onPress}
    />
  );
}
