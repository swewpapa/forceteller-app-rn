import { fetchSplashConfig, pickImageUrl } from './splash-api';
import type { SplashMeta } from './splash-types';

/**
 * SWR 갱신 로직(순수). 새 이미지가 있고 prefetch에 성공하면 다음 실행용 메타를 반환,
 * 그 외(변경 없음/실패)에는 null. 어떤 경우에도 throw하지 않는다.
 */
export async function revalidateSplash(deps: {
  configUrl: string;
  currentId: string | null;
  prefetch: (url: string) => Promise<boolean>;
}): Promise<SplashMeta | null> {
  const config = await fetchSplashConfig(deps.configUrl);
  if (!config) return null;

  const url = pickImageUrl(config);
  if (!url) return null;

  const id = config.id ?? url;
  if (deps.currentId === id) return null;

  const ok = await deps.prefetch(url);
  if (!ok) return null;

  return { appliedUrl: url, appliedId: id };
}
