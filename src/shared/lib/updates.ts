import * as Updates from 'expo-updates';

export type UpdateResult = 'applied' | 'none' | 'rolled-back' | 'error';

/**
 * OTA 업데이트를 확인해 있으면 받고 즉시 적용한다.
 *
 * 네이티브 설정이 checkAutomatically=NEVER이므로 호출 시점(포그라운드 복귀 등)은 호출부가 통제한다.
 * 서버/네트워크 실패는 조용히 삼켜(error 반환) 임베디드/기존 번들을 유지한다 — 앱 시작 비차단 원칙.
 * rollBackToEmbedded directive는 서버가 임베디드 번들로 되돌리라는 지시로, 동일하게 fetch→reload한다.
 */
export async function checkAndApplyUpdate(): Promise<UpdateResult> {
  if (!Updates.isEnabled) return 'none';
  try {
    const check = await Updates.checkForUpdateAsync();
    if (check.isRollBackToEmbedded) {
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync();
      return 'rolled-back';
    }
    if (!check.isAvailable) return 'none';
    await Updates.fetchUpdateAsync();
    await Updates.reloadAsync();
    return 'applied';
  } catch {
    return 'error';
  }
}
