// jest용 expo-updates 모킹. 네이티브 모듈이라 auto-mock이 불가하므로 수동 정의한다.
// 상태 플래그는 기본값을 주고, 비동기 API는 jest.fn으로 두어 각 테스트가 mockResolvedValue로 제어한다.
module.exports = {
  __esModule: true,
  isEnabled: true,
  channel: 'poc',
  runtimeVersion: '1.0.0',
  isEmbeddedLaunch: true,
  checkForUpdateAsync: jest.fn(),
  fetchUpdateAsync: jest.fn(),
  reloadAsync: jest.fn(),
};
