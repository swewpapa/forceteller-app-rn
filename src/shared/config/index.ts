export { env } from './env';
// 원격 config 동기 게터(순수, side-effect 없음). MMKV wiring(config-setup)은 배럴 미노출 — App만 직접 import.
export { remoteConfig } from './remote-config/remote-config';
export type { RemoteConfig } from './remote-config/remote-config';
