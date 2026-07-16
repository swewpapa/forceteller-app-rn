const { getDefaultConfig } = require('expo/metro-config');

// expo winter 런타임의 전역 fetch 교체(expo 네이티브 fetch)를 끄고 RN fetch(XHR 기반)를 유지한다.
// 이유: RN DevTools Network 패널은 RN 네트워킹 파이프라인만 캡처 — expo fetch는 아직 미통합(공식 planned).
// dev/release 번들 모두 Metro를 타므로 여기서 주입해 fetch 구현을 환경 간 동일하게 유지한다.
// RN DevTools가 Expo Fetch를 통합하면 이 줄을 지우고 expo fetch로 복귀 검토.
process.env.EXPO_PUBLIC_USE_RN_FETCH ??= '1';

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * react-native-svg-transformer: .svg를 React 컴포넌트로 import (Expo SDK 41+ 설정).
 * svg를 assetExts에서 빼고 sourceExts로 옮겨 transformer가 처리하게 한다.
 * https://github.com/kristerkari/react-native-svg-transformer#for-expo-sdk-v41000-or-newer
 *
 * @type {import('expo/metro-config').MetroConfig}
 */
module.exports = (() => {
  const config = getDefaultConfig(__dirname);
  const { transformer, resolver } = config;

  config.transformer = {
    ...transformer,
    babelTransformerPath: require.resolve('react-native-svg-transformer/expo'),
  };
  config.resolver = {
    ...resolver,
    assetExts: resolver.assetExts.filter((ext) => ext !== 'svg'),
    sourceExts: [...resolver.sourceExts, 'svg'],
  };

  return config;
})();
