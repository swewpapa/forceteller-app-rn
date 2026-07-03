# Firebase dev/prod 환경 분리 설계

**작성일:** 2026-06-30
**브랜치:** `feature/firebase-env-separation`
**관련:** 인증(Firebase Auth + 구글 로그인) 후속 인프라. 인증 게이트는 이 작업 완료 후 활성화 예정.

---

## Goal

dev/prod 두 환경을 **빌드타임에 분리**해, 환경별로 **별도 Firebase 프로젝트**와 **별도 API/Web URL**을 사용한다. 식별자·표시명은 동일하게 유지한다. 국가별 분리는 이 작업의 범위 밖이며, 미래 확장 경로만 막지 않는다.

## Architecture (요약)

환경(dev/prod)을 **Android flavor dimension `"env"`** + **iOS dev/prod scheme**으로 가른다. 네이티브 `google-services` 파일이 환경별 **Firebase default app을 자동 초기화**하고, `react-native-config`의 `.env.{env}`가 API/Web URL과 클라이언트 ID를 주입한다. 식별자·표시명은 dev/prod 동일이라 한 기기에 동시 설치는 불가하다(의도된 트레이드오프).

## Tech Stack

- `@react-native-firebase/app`·`auth` 25.1.0 — 네이티브 default app 자동 초기화 모델
- `@react-native-google-signin/google-signin` 16.1.2
- `react-native-config` 1.6.1 — `.env` + `ENVFILE`/`envConfigFiles`
- Android Gradle — `productFlavors`, `com.google.gms.google-services` 플러그인
- iOS Xcode — scheme, xcconfig, Build Phase script

---

## 배경 / 현황

### RN 프로젝트 (forceteller-app-rn)
- **dev/prod 분리 없음**: `productFlavors` 0, `buildTypes`는 debug/release만(release도 `debug.keystore`로 임시 서명 — `android/app/build.gradle:101`), `.env` 파일 없음 → `env.ts`가 하드코딩 fallback 사용
- **Firebase 초기화 0**: iOS `FirebaseApp.configure()` 없음, Android `google-services` 플러그인/json 없음, `firebase.json` 없음
- 식별자 단일: `com.un7qi3i.forceteller` (iOS/Android 공통)
- `react-native-config` 설치됐으나 Android `dotenv.gradle` 연동 라인 없음(expo autolinking에만 의존)

### 레거시 forceteller-app (Capacitor + Ionic, 활성 운영)
환경 축과 국가 축이 **직교**하며 서로 다른 메커니즘으로 처리된다:

| 축 | 메커니즘 | 무엇이 다른가 |
|---|---|---|
| 환경 (dev/beta/prod) | 웹 Vite `mode` (`env.{production,development,beta}.ts`) | **API URL만**. Firebase는 **공유** |
| 국가 (KR/JP/US) | 빌드타임 — Android flavor dimension `country`, iOS 3 target/scheme, fastlane `.env.ko/.ja/.en` | Firebase 프로젝트 3개, applicationId, 표시명, OneSignal·MoEngage·OAuth·AdMob 등 다수 |

- 국가는 **빌드타임 고정**(런타임 스위칭 불가, 변경 시 계정 분리 + 재시작)
- **dev 전용 Firebase 프로젝트 없음** (dev도 prod Firebase 사용)
- Firebase 프로젝트: KR `forceteller-151103` / JP `forceteller-jp` / US `forceteller-en`
- Android google-services 배치: `android/app/src/<country>/google-services.json` (flavor sourceSet)
- iOS plist: `ios/App/Targets/Universal/Config/Firebase/GoogleService-Info-{KR,JP,US}.plist`

**RN과의 차이**: 레거시는 dev/prod로 Firebase를 안 가르지만, 우리는 **테스트 격리를 위해 dev/prod Firebase를 분리**한다(dev 전용 프로젝트 사용). 국가축은 미래에 레거시식 flavor dimension으로 확장한다.

---

## 결정 사항

| 항목 | 결정 | 근거 |
|---|---|---|
| **범위** | dev/prod 환경 분리만 | 국가는 별도 spec. 단순화 + 인증 실동작 최단 경로 |
| **분리 대상** | Firebase 프로젝트 + API/Web URL | 사용자 선택 |
| **비분리** | applicationId/bundleId, 표시명 동일 | 사용자 선택 → 한 기기 동시 설치 불가(트레이드오프 수용) |
| **Firebase 초기화** | 네이티브 파일 분리 + 자동 초기화 | JS init 경로 검토 후 기각(아래) |
| **빌드 변형** | 환경 flavor dimension(Android), dev/prod scheme(iOS) | 레거시 flavor 일관 + 미래 국가축 `["env","country"]` 증분 확장 |

### JS init 경로를 기각한 이유 (검토 기록)
`@react-native-firebase`는 default app을 JS `initializeApp(config)`로 초기화하는 경로가 존재하고 Auth도 secondary/JS app에서 동작함을 공식 문서로 확인했다. `.env`에 Firebase config를 넣으면 빌드 변형을 거의 제거할 수 있는 매력적 단순화였으나, 다음 **미검증 리스크**로 기각:
1. Android `google-services` 플러그인/json 없이 빌드·동작하는지 공식 미보장(플러그인이 빌드타임 리소스/manifest 주입)
2. **iOS google-signin은 reversed client id를 URL scheme으로 Info.plist에 등록해야** 하는데, dev/prod OAuth client가 달라 이 네이티브 설정은 JS로 빼도 남음
3. 네이티브 자동 초기화를 끄고 JS로 완전 대체할 때의 타이밍/안정성

표준(네이티브 파일 자동 초기화)이 안전하고, flavor 인프라는 미래 국가축에 재사용되므로 버리는 투자가 아니다.

---

## 컴포넌트별 설계

### ① JS/env 레이어

| 파일 | 동작 | 비고 |
|---|---|---|
| `.env.dev` | **Create** | dev 값 (아래 키) |
| `.env.prod` | **Create** | prod 값 |
| `.env.example` | **Create** | 키 목록 + 더미값(커밋용) |
| `.gitignore` | **Modify** | `.env*` 무시(단 `.env.example` 예외) |
| `src/shared/config/env.ts` | **수정 없음** | 이미 `Config.*` 읽음 |

`.env.{env}` 키 (현 `env.ts`가 읽는 키와 동일):
```
API_BASE_URL=          # dev: 보유한 dev API / prod: https://api.forceteller.com
WEB_BASE_URL=          # <PLACEHOLDER — 추후 확정>
SPLASH_CONFIG_URL=     # 환경별
GOOGLE_WEB_CLIENT_ID=  # dev/prod Firebase의 Web client id (다름)
MMKV_ENCRYPTION_KEY=   # 환경별 권장
```

> `.env*`를 gitignore하므로 실제 비밀값은 커밋되지 않는다. CI/로컬은 각 환경의 `.env.{env}`를 별도 주입한다. `.env.example`이 키 계약을 문서화한다.

### ② Android — flavor dimension `"env"`

`android/app/build.gradle` (Modify):
```gradle
android {
    flavorDimensions "env"
    productFlavors {
        dev  { dimension "env" }    // applicationId suffix 없음(동일)
        prod { dimension "env" }
    }
}
// dotenv.gradle 적용 이전에 위치해야 함
project.ext.envConfigFiles = [
    dev:  ".env.dev",
    prod: ".env.prod",
]
apply from: project(':react-native-config').projectDir.getPath() + "/dotenv.gradle"
apply plugin: 'com.google.gms.google-services'
```

`android/build.gradle` (Modify) — 플러그인 classpath:
```gradle
buildscript { dependencies { classpath('com.google.gms:google-services:<버전>') } }
```

google-services 파일 (Create, **콘솔에서 다운로드**):
- `android/app/src/dev/google-services.json` (dev Firebase 프로젝트)
- `android/app/src/prod/google-services.json` (prod Firebase 프로젝트)

flavor sourceSet은 google-services 플러그인이 빌드 시 자동 매핑한다(레거시 `src/<country>/`에서 실증). build variant: `devDebug`/`devRelease`/`prodDebug`/`prodRelease` — 환경 × 빌드타입 독립.

> ⚠️ **검증 필요**: `envConfigFiles`의 키가 flavor 이름(`dev`/`prod`)으로 매칭되는지 — 공식 README 예시는 `debug`/`release`(buildType) 키만 보여줌. 구현 Task에서 실빌드로 확인(필요 시 키를 `devDebug`처럼 variant 전체 이름으로 조정).

### ③ iOS — dev/prod scheme

- **scheme 2개**: `Forceteller Dev`, `Forceteller`
- **ENVFILE 매핑**: Podfile `post_install`에서 Build Configuration별 `ENVFILE` 지정(공식 패턴). 환경×빌드타입 독립을 위해 Build Configuration을 환경별로 구성(예: `Debug-dev`/`Release-dev`/`Debug-prod`/`Release-prod`) 또는 scheme pre-action으로 `.env` 선택 — 구체 방식은 plan에서 확정.
- **GoogleService-Info plist**: `GoogleService-Info-Dev.plist` / `GoogleService-Info.plist`(Create, 콘솔에서). Build Phase script가 활성 Configuration에 맞는 plist를 빌드 시 복사.
- **AppDelegate.swift** (Modify): `import Firebase` + `FirebaseApp.configure()`를 `didFinishLaunchingWithOptions`에 추가(plist 자동 탐색).
- **Info.plist** (Modify): google-signin reversed client id URL scheme. **dev/prod OAuth client가 달라 환경별로 달라야** 함 — xcconfig 변수 주입 또는 scheme별 처리.

> ⚠️ **검증 필요**: ① 멀티 plist 선택 Build Phase(공식 멀티 가이드 없음), ② reversed client id 환경별 URL scheme 주입. iOS 빌드 변형의 핵심 난점 — plan에서 정밀 설계.

### ④ Firebase 초기화 흐름

- **Android**: `google-services` 플러그인이 빌드타임 리소스 생성 → `@react-native-firebase/app`이 default app 자동 초기화(MainApplication 수정 불필요)
- **iOS**: AppDelegate `FirebaseApp.configure()`가 번들된 plist로 default app 초기화
- 인증 코드 `getAuth()`(= default app, `src/features/auth/providers/firebase.ts`)는 **변경 없음**

---

## 데이터 흐름

```
빌드 variant 선택 (devDebug / prodRelease / iOS scheme)
   │
   ├─ ENVFILE → .env.{env} 로드 → react-native-config Config.* → env.ts → 앱 전역(API/Web URL, client id)
   │
   └─ src/<env>/google-services.json (Android) | GoogleService-Info-*.plist (iOS)
         → 네이티브 Firebase default app 자동 초기화 → getAuth()
```

---

## 미해소 제약 / 검증 필요 (구현 Task에서 해소)

1. **react-native-config Android 연동 부재** → `apply from dotenv.gradle` 추가 + `envConfigFiles` flavor 키 매칭 실빌드 검증
2. **iOS reversed client id 환경별 URL scheme** → plan에서 xcconfig/Build Phase 정밀 설계
3. **iOS 환경 × 빌드타입 독립 구성** → Build Configuration/scheme 구성 방식 확정
4. **google-services 파일** → dev/prod 프로젝트에서 다운로드(프로젝트 **보유 확인됨**)
5. **release 서명** → 현재 release가 `debug.keystore` 사용 중. 이번 범위 밖이나, prod flavor 빌드 시 인지 필요(별도 작업)

## 전제 (충족 상태)

- dev/prod Firebase 프로젝트: **보유** ✅
- dev API: **보유** ✅ (실제 URL은 `.env.dev`에 주입)
- Web URL(dev/prod): **placeholder** — 추후 확정해 `.env`에 반영

---

## 테스트 전략

- **단위**: `env.ts` — `react-native-config` Config를 mock해 dev/prod 값이 올바르게 매핑되는지(today-store `getState()` 테스트 패턴 준용)
- **빌드 검증**: `devDebug`·`prodRelease` 실빌드로 (a) 올바른 Firebase `project_id` 연결, (b) `.env` 값 주입, (c) google-signin 로그인 동작 확인
- **회귀**: 기존 40개 테스트 통과 유지

---

## 국가축 확장 경로 (미래, 범위 밖)

```gradle
flavorDimensions "env", "country"   // dev/prod × kr/jp/us
```
google-services는 flavor 조합 sourceSet으로 배치. iOS는 레거시처럼 target/scheme 확장. 지금 `env` dimension만 깔아두면 `country` 추가가 **증분**으로 끝난다(레거시에서 검증된 패턴).
