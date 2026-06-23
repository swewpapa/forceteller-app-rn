import { Platform } from 'react-native';
import type { SplashConfig } from './splash-types';

/** splash.json을 받아온다. 실패/타임아웃이면 null (부팅을 막지 않음). */
export async function fetchSplashConfig(
  url: string,
  timeoutMs = 3000,
): Promise<SplashConfig | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    return (await res.json()) as SplashConfig;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** 현재 플랫폼에 해당하는 이미지 URL을 고른다. */
export function pickImageUrl(config: SplashConfig): string | null {
  const url = Platform.OS === 'ios' ? config.ios : config.android;
  return url ?? null;
}
