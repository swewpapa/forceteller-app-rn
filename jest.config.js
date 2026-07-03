module.exports = {
  preset: '@react-native/jest-preset',
  // @react-navigation/native의 배포 산출물이 순수 ESM(export 문법)이라
  // 프리셋 기본 transformIgnorePatterns(RN 계열만 포함)로는 변환 대상에서 빠져
  // "Unexpected token 'export'"로 실패한다. 기본 패턴에 @react-navigation만 추가.
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation)/)',
  ],
};
