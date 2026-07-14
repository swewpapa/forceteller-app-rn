import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import BootSplash from 'react-native-bootsplash';
import { createMMKV } from 'react-native-mmkv';
import { env } from '@/shared/config';
import { createSplashStorage } from './splash-storage';
import { useRemoteSplash } from './use-remote-splash';

const storage = createSplashStorage(createMMKV({ id: 'splash' }));
const prefetch = (url: string): Promise<boolean> => Image.prefetch(url, { cachePolicy: 'disk' });

const MIN_VISIBLE_MS = 1000;
const FADE_MS = 300;
const fallback = require('@/assets/splash-fallback.png');

/**
 * 네이티브 스플래시(bootsplash) 위에서 remote 이미지를 SWR로 표시하는 게이트.
 * 캐시된 이미지를 즉시 보여주고(stale), 백그라운드로 갱신(revalidate)한다.
 * 어떤 네트워크 상태에서도 최소 표시 후 사라진다(부팅 비차단).
 */
export function SplashGate({ children }: { children: ReactNode }) {
  const { imageUrl } = useRemoteSplash({
    configUrl: env.splashConfigUrl,
    storage,
    prefetch,
  });
  const [mounted, setMounted] = useState(true);
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    BootSplash.hide({ fade: true });
    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: FADE_MS,
        useNativeDriver: true,
      }).start(() => setMounted(false));
    }, MIN_VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [opacity]);

  return (
    <View style={styles.root}>
      {children}
      {mounted && (
        <Animated.View style={[styles.overlay, { opacity }]} pointerEvents="none">
          <Image
            source={imageUrl ? { uri: imageUrl } : fallback}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            cachePolicy="disk"
          />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#191919',
  },
});
