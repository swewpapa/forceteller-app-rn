import { remoteConfig } from '@/shared/config';
import { useAuthStore } from '@/features/auth';
import { usePopoverDismissed } from '@/shared/components/popover/popover-dismiss';

/**
 * 앱바 무료포스 툴팁(popover) 노출 여부.
 * 세 조건 AND: 원격 config가 lottie 버튼 + 로그인 상태 + 아직 dismiss 안 함.
 */
export function useFreeForceTip(): boolean {
  const status = useAuthStore((s) => s.status);
  const dismissed = usePopoverDismissed('freeforce');
  const cfg = remoteConfig.getJSON<{ appBarButtonType?: string }>('free_force_config', {});
  return cfg.appBarButtonType === 'lottie' && status === 'authenticated' && !dismissed;
}
