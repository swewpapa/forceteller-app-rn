module.exports = {
  preset: '@react-native/jest-preset',
  // @react-navigation/native의 배포 산출물이 순수 ESM(export 문법)이라
  // 프리셋 기본 transformIgnorePatterns(RN 계열만 포함)로는 변환 대상에서 빠져
  // "Unexpected token 'export'"로 실패한다. 기본 패턴에 @react-navigation만 추가.
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation)/)',
  ],
  // ota-poc/는 독립 실험 워크스페이스(gitignore), .claude/는 CC 백그라운드 세션 워크트리 —
  // 둘 다 앱 테스트 러너·haste 맵을 오염시키지 않는다(작업 중 사본의 실패가 섞이는 것 방지).
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/ota-poc/', '<rootDir>/.claude/'],
  modulePathIgnorePatterns: ['<rootDir>/ota-poc/', '<rootDir>/.claude/'],
};
