# 스플래시 Remote 이미지 (SWR) — 설계 스펙

- **날짜:** 2026-06-23
- **상태:** 승인됨 (구현 대기)
- **작업:** 기존 `forceteller-app`(Ionic/Angular/Capacitor)의 네이티브 S3 스플래시를 RN으로 포팅
- **관련 문서:** [docs/architecture.md](../../architecture.md)

---

## 1. 배경 & 목표

기존 `forceteller-app`은 **네이티브 레벨**에서 S3(CloudFront) 이미지를 받아 스플래시에 표시한다. Capacitor의 `SplashScreen` 플러그인을 fork해, 번들 이미지를 placeholder로 띄우고 백그라운드로 remote 이미지를 받아 같은 `ImageView`에서 교체하는 구조다.

RN(`forceteller-app-rn`)에는 Capacitor(단일 WebView)가 없으므로, 같은 UX를 **JS 오버레이 + SWR(stale-while-revalidate)** 방식으로 재현한다. 운영 인프라(`splash.json` 엔드포인트, S3/CloudFront)는 **그대로 재사용**한다.

### 목표
- 앱 부팅 시 remote 스플래시 이미지를 **즉시(캐시 우선)** 표시한다.
- 네트워크는 부팅을 **절대 막지 않는다** (어떤 실패에도 스플래시는 빠르게 사라진다).
- 도입하는 이미지 스택(`expo-image`)을 **앱 전반 이미지의 표준**으로 삼는다 (서비스 특성상 이미지가 많음).

---

## 2. 기존 앱 구현 분석 (참고)

Android·iOS가 거의 동일한 설계를 사용한다.

| 항목 | Android | iOS |
|---|---|---|
| 설정 fetch | OkHttp (`FORCE_NETWORK`) | Alamofire |
| 이미지 키 | `json.android` | `json.ios` |
| 이미지 로드·캐시 | Glide (`DiskCache.ALL`, signature=`id`) | Kingfisher (디스크 10일 만료) |
| 이미지 타임아웃 | 3초 | 5초 |
| placeholder/폴백 | 번들 `splash.png` | 번들 `Splash` imageset |
| 스플래시 종료 | `launchAutoHide:false` → JS가 `hide()` | 동일 |

### 운영 엔드포인트 (재사용)
- KR: `https://static.forceteller.com/images/splash/splash.json`
- EN: `https://static-en.forceteller.com/images/splash/splash.json`

### 응답 구조 (기존 코드 기반 — ⚠️ 실제 스키마 재확인 필요, §10 선결과제)
```json
{
  "android": "https://.../splash-image.png",
  "ios": "https://.../splash-image.png",
  "id": "cache-key"
}
```
- `id`는 캐시 무효화 키 (없으면 이미지 URL 자체를 키로 사용).

---

## 3. 결정 사항

| # | 결정 | 근거 |
|---|---|---|
| D1 | **JS 오버레이 방식** (네이티브 모듈 포팅 X) | 단일 코드베이스, FSD 구조에 자연 통합, 유지보수성. 기존도 "첫 프레임=번들, 네트워크 후 교체"라 UX 동등 재현 가능 |
| D2 | **SWR (캐시 우선 + 백그라운드 갱신)** | 스플래시는 짧아야 함 → 네트워크 완료 보장 불가. 캐시 즉시 표시 + 다음 실행 반영이 체감속도·오프라인·최신성 균형 최적 |
| D3 | 네이티브 스플래시 = **react-native-bootsplash** | 수동 `hide({fade})`, `useHideAnimation`으로 JS 오버레이 이음새 없는 전환 |
| D4 | 이미지·캐싱 = **expo-image** (via `expo-modules-core`) | `cachePolicy:'disk'` + `Image.prefetch`가 SWR과 1:1. 앱 전반 이미지 표준 겸용. Expo 프레임워크 전환 아님(모듈만 도입) |
| D5 | 캐시 메타 저장 = **react-native-mmkv** | 부팅 초기 **동기** 읽기 → 첫 프레임 깜빡임 방지 (호환 불가 시 async-storage 폴백) |

> **D4 보충:** `expo-image`의 `Image.prefetch()`가 디스크 다운로드+저장을 모두 담당하므로 별도 다운로드 라이브러리(blob-util 등)는 **불필요**. 이미지 파일은 expo-image 디스크 캐시가 관리하고, MMKV에는 "마지막으로 적용된 URL/id" 메타만 저장한다.

---

## 4. 아키텍처 (FSD 배치)

스플래시는 화면 도메인이 아니라 **앱 부팅 관심사**이므로 `app` 레이어에 둔다. 범용 이미지 캐싱 유틸이 향후 생기면 `shared`로 승격한다.

```
src/app/splash/
  splash-gate.tsx       # bootsplash 제어 + JS 오버레이 렌더 + hide/페이드 타이밍
  use-remote-splash.ts  # SWR 훅: 캐시 메타 읽기 → splash.json fetch → prefetch → 메타 저장
  splash-api.ts         # splash.json fetch (static.* 도메인, apiClient와 별개)
  splash-storage.ts     # MMKV 캐시 메타 read/write
  splash-types.ts       # SplashConfig, 캐시 메타 타입
src/shared/config/env.ts  # splashConfigUrl 추가
```

- `App.tsx`가 `SplashGate`를 조립한다 (`app`은 자유롭게 import 가능).
- 의존성 방향(`shared → features → app`) 위반 없음.

---

## 5. 부팅 시퀀스 (데이터 플로우)

1. 앱 실행 → **bootsplash** 네이티브 스플래시 표시 (번들 폴백 이미지, 배경 `#191919`).
2. `App.tsx` → `SplashGate` 마운트 (bootsplash 아직 표시 중, `launchAutoHide` 비활성).
3. MMKV에서 **마지막 적용 이미지 URL**(`appliedUrl`)을 **동기** 읽기.
   - 있으면 → `expo-image`(`cachePolicy:'disk'`)로 **즉시 표시** (이전 prefetch로 디스크에 존재 → 즉시 렌더).
   - 없으면(첫 실행) → 번들 폴백 이미지 유지.
4. `BootSplash.hide({ fade: true })` → JS 오버레이로 이음새 없이 전환.
5. **백그라운드 갱신 (비차단):**
   - `splash.json` fetch → `Platform.OS`로 `json.ios` / `json.android` URL 추출.
   - 응답 `id`가 저장된 `appliedId`와 **다르면** → `Image.prefetch(newUrl)` (디스크 다운로드·저장).
   - prefetch **성공 시에만** MMKV에 `appliedUrl=newUrl`, `appliedId=newId` 저장 → **다음 실행에 반영**.
6. JS 오버레이 **최소 표시 시간(1000ms)** 경과 후 페이드아웃(300ms) → 언마운트 → 메인 화면.

---

## 6. 데이터 모델

### splash.json (remote)
```ts
type SplashConfig = {
  ios?: string;      // iOS 이미지 URL
  android?: string;  // Android 이미지 URL
  id?: string;       // 캐시 무효화 키
};
```

### 캐시 메타 (MMKV)
```
splash.appliedUrl : string   // 현재 화면에 쓰는(=디스크에 prefetch 완료된) 이미지 URL
splash.appliedId  : string   // 위 URL에 대응하는 id (갱신 판단용)
```

---

## 7. 폴백 / 에러 처리 (전 단계 비차단)

| 상황 | 처리 |
|---|---|
| `splash.json` fetch 실패/타임아웃 | 무시 (캐시/번들 유지), 다음 실행 재시도 |
| `Image.prefetch` 실패 | 무시 (현재 `appliedUrl` 유지, 메타 갱신 안 함) |
| 첫 실행(캐시 메타 없음) | 번들 폴백 이미지 표시 |
| 응답에 플랫폼 키 없음 | 무시, 번들/캐시 유지 |

**불변식:** 어떤 네트워크 상태에서도 스플래시는 최소 표시 시간 내에 사라진다. 네트워크는 부팅을 게이팅하지 않는다.

---

## 8. 타이밍 정책

- bootsplash: `launchAutoHide` 비활성 → `SplashGate`가 캐시 판단 후 수동 `hide({fade:true})`.
- JS 오버레이 최소 표시: **1000ms** (브랜딩 목적), 이후 페이드아웃 **300ms**.
- `splash.json` fetch 타임아웃: **3초** (초과 시 갱신 포기, 다음 실행).
- 초기 데이터 프리로드로 스플래시를 연장하는 게이팅은 **본 작업 비범위** (§11).

---

## 9. 테스트 계획

기존 `features/today/__tests__` 패턴(Jest)을 따른다.

- `splash-storage`: 메타 read/write, 빈 상태 처리.
- `splash-api`: JSON 파싱, `Platform.OS` 키 선택, 잘못된 응답 처리.
- `use-remote-splash`: 캐시 hit/miss, `id` 변경 감지, prefetch 실패 시 메타 미갱신.

---

## 10. 선결 과제 (구현 1단계에서 검증)

1. ⚠️ **expo-modules-core / expo-image의 RN 0.86 호환 버전 확정** — RN 0.86이 최신이라 지원 SDK 버전 확인 필수. 불가 시 D4 재검토.
2. **react-native-mmkv** New Arch / RN 0.86 호환 확인 — 불가 시 async-storage 폴백(첫 프레임 번들 후 비동기 교체).
3. **`splash.json` 실제 응답 스키마 재확인** — 기존 앱 분석은 추정 포함(`id` 필드 유무, 키 이름). 실제 운영 응답으로 검증.

---

## 11. 비범위 (Out of Scope)

- 로케일별 `splash.json` URL 분기 (현재 단일 리전 `api.forceteller.com`; env 확장 여지만 남김).
- 유지보수 모드(`/api/service/status`), 이벤트 팝업(`/api/notice/popup`) — 별도 작업.
- 초기 데이터 프리로드로 스플래시 연장하는 게이팅.
- 네이티브 스플래시 자체를 remote화 (JS 오버레이로 충분).
