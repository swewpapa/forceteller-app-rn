// jest용 expo-image 모킹.
// expo-image의 main 엔트리(src/index.ts)가 순수 ESM(export 문법)이라
// jest transformIgnorePatterns(RN/@react-native/@react-navigation만 화이트리스트)
// 아래서 "Unexpected token 'export'"로 실패한다. react-native-mmkv 등과 동일하게
// 수동 목으로 대체(node_modules 목은 루트 __mocks__에서 자동 적용).
const React = require('react');

function Image(props) {
  return React.createElement('expo-image', props);
}

function ImageBackground(props) {
  return React.createElement('expo-image-background', props);
}

module.exports = {
  __esModule: true,
  Image,
  ImageBackground,
  useImage: () => null,
};
