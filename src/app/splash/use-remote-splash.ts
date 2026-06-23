import { useEffect, useState } from 'react';
import { revalidateSplash } from './revalidate-splash';
import type { SplashStorage } from './splash-storage';

/**
 * 초기 렌더에 캐시된 이미지 URL을 즉시 반환하고(SWR의 "stale"),
 * 마운트 시 백그라운드로 갱신해 성공하면 다음 실행용 메타를 저장한다("revalidate").
 */
export function useRemoteSplash(deps: {
  configUrl: string;
  storage: SplashStorage;
  prefetch: (url: string) => Promise<boolean>;
}) {
  const { configUrl, storage, prefetch } = deps;
  const [imageUrl] = useState<string | null>(() => storage.read()?.appliedUrl ?? null);

  useEffect(() => {
    let cancelled = false;
    revalidateSplash({
      configUrl,
      currentId: storage.read()?.appliedId ?? null,
      prefetch,
    }).then((meta) => {
      if (meta && !cancelled) storage.write(meta);
    });
    return () => {
      cancelled = true;
    };
    // 마운트 1회만 실행 (deps는 모듈 싱글턴).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { imageUrl };
}
