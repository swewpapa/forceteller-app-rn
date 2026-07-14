const { getDefaultConfig } = require('expo/metro-config');

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
