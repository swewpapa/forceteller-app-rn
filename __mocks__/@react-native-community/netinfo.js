// 네이티브 모듈이라 jest 환경에 없음 — 패키지가 제공하는 공식 mock을 그대로 사용.
// (shared/lib 배럴 → query-managers → NetInfo 체인으로 api 테스트들이 로드함)
module.exports = require('@react-native-community/netinfo/jest/netinfo-mock');
