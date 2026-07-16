import { AppState, Platform } from 'react-native';
import type { AppStateStatus } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { focusManager, onlineManager } from '@tanstack/react-query';

/**
 * RN에는 브라우저 online/offline 이벤트가 없어 배선 없이는 쿼리가 네트워크 상태를
 * 모른다(오프라인 미감지, 재접속 자동 refetch 없음). NetInfo를 onlineManager에 연결한다.
 * 공식 레시피: https://tanstack.com/query/v5/docs/framework/react/react-native
 */
export function initQueryOnlineManager() {
  onlineManager.setEventListener((setOnline) =>
    NetInfo.addEventListener((state) => setOnline(!!state.isConnected)),
  );
}

/**
 * 웹 refetchOnWindowFocus의 RN 대응 — 앱이 포그라운드로 복귀하면 stale 쿼리가
 * 자동 갱신되도록 AppState를 focusManager에 연결한다. 구독 해제 함수를 반환한다.
 */
export function subscribeQueryFocusManager() {
  const onChange = (status: AppStateStatus) => {
    if (Platform.OS !== 'web') {
      focusManager.setFocused(status === 'active');
    }
  };
  const subscription = AppState.addEventListener('change', onChange);
  return () => subscription.remove();
}
