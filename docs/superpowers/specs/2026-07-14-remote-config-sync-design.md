# Remote Config Sync 설계

## 목표
`GET /api/config/:provider`(Firebase Remote Config 프록시)에서 피처 플래그/설정값을 받아 앱 전역에서 동기로 읽고, 서버와 최신 동기화(SWR)한다. splash의 SWR 패턴을 미러링한다.

## 배경 (팩트)
- 응답: `{ status, data: { parameters: [{ key, type, value }] } }`. `type ∈ JSON|STRING|BOOLEAN(|NUMBER)`.
- 예: `use_donation`(bool), `free_force_config`(json), `inwebview_whitelisted`(string), `adx_config`(json), `free_fortune_count`(string) …
- 전역·부팅 크리티컬(웹뷰 화이트리스트/광고/기능 토글), **인증 불필요**(게스트 200).
- API 베이스(`api-dev...`)라 shared http client로 페치(피처 API 패턴). 캐시/동기는 splash SWR.

## 결정 (Martin 승인)
- **접근**: MMKV 캐시 + 동기 store(SWR). 부팅 시 캐시 동기 하이드레이트 → `remoteConfig.getBool(key)` 어디서든 동기.
- **게이트**: 논블로킹 stale-first. 세션은 부팅 스냅샷 사용, 갱신분은 다음 실행 적용(splash 동형). 첫 실행(캐시 없음)은 페치 성공 시 seed.

## 모듈 (`src/shared/config/remote-config/`)
| 파일 | 책임 | 테스트 |
|---|---|---|
| `config-types.ts` | `RemoteConfig = Record<string, unknown>` | — |
| `normalize-config.ts` | `parameters[]` → 타입 맵. type별 강제변환, 미지 type·key없음 드롭 | 순수 TDD |
| `config-api.ts` | `createConfigApi(client).get(provider)` → GET `/api/config/{provider}` → normalize | — |
| `config-storage.ts` | MMKV DI(`KVStore`), provider별 `config.{provider}` JSON read/write | DI fake TDD |
| `remote-config.ts` | 싱글턴: `apply(cfg)` + `getBool/getString/getNumber/getJSON`(가드+기본값) | 순수 TDD |
| `revalidate-config.ts` | 순수 SWR: `fetchConfig(provider)` → cfg \| null(throw 안 함) | 순수 TDD |
| `use-remote-config.ts` | 마운트 시 revalidate → `apply` + `storage.write` | — |
| `config-setup.ts` | `createMMKV({id:'config'})` + storage + `initRemoteConfig()`(동기 하이드레이트) + `useRemoteConfigSync()`. **MMKV side-effect 격리 — 배럴 미노출, App만 deep import** | — |

## 데이터 플로우
1. App 모듈 로드: `initRemoteConfig()` — `storage.read(provider)`를 `remoteConfig.apply` (동기, 렌더 전)
2. App 컴포넌트: `useRemoteConfigSync()` — 백그라운드 `revalidate` → 성공 시 `apply` + MMKV write
3. 소비: `import { remoteConfig } from '@/shared/config'` → `remoteConfig.getBool('use_donation', false)` 등 동기

## 경계/규약
- 배럴 `@/shared/config`는 `env` + `remoteConfig`(순수 게터) + `RemoteConfig` 타입만 노출. `config-setup`(MMKV)은 App이 직접 import(side-effect 격리).
- 실패/미지 값은 캐시/기본값 유지 → 부팅 비차단.
- 세션 내 라이브 반영(kill-switch)은 범위 밖(다음 실행 적용). 필요 시 zustand 구독 후속.

## 제공 게터 계약
- `getBool(key, fallback=false)`: 값이 boolean일 때만, 아니면 fallback
- `getString(key, fallback='')`: string일 때만
- `getNumber(key, fallback=0)`: number & !NaN일 때만
- `getJSON<T>(key, fallback)`: object일 때만
