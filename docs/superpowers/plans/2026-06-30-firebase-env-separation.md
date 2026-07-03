# Firebase dev/prod 환경 분리 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** dev/prod 두 환경을 빌드타임에 분리해, 환경별로 별도 Firebase 프로젝트와 별도 API/Web URL을 사용한다(식별자·표시명은 동일).

**Architecture:** 환경(dev/prod)을 Android flavor dimension `"env"` + iOS dev/prod 빌드 구성으로 가른다. 네이티브 `google-services` 파일이 환경별 Firebase default app을 자동 초기화하고, `react-native-config`의 `.env.{env}`가 API/Web URL·client id를 주입한다.

**Tech Stack:** @react-native-firebase 25.1.0, react-native-config 1.6.1, Android Gradle(productFlavors + google-services plugin), iOS Xcode(Build Configuration/scheme + Build Phase).

**Spec:** `docs/superpowers/specs/2026-06-30-firebase-env-separation-design.md`

---

## 사전 준비 (사람이 수행 — 코딩 전 확보)

이 plan은 아래 외부 산출물을 전제한다. 보유 확인됨(dev/prod Firebase 프로젝트, dev API). 구현자는 시작 전에 다음을 손에 넣어야 한다:

- **dev Firebase**: `google-services.json`(Android) + `GoogleService-Info.plist`(iOS) — dev 프로젝트 콘솔에서 다운로드
- **prod Firebase**: 동일 2개 파일 — prod 프로젝트 콘솔에서 다운로드
- **각 환경의 Web client id**(`GOOGLE_WEB_CLIENT_ID`): Firebase 콘솔 → Authentication → Google 공급자 → Web SDK 구성, 또는 google-services 파일의 `oauth_client` 중 `client_type: 3`
- **dev API base URL** 실제 값, **prod API base URL**(`https://api.forceteller.com` — 현 fallback)
- Web URL은 placeholder로 두고 추후 확정

> 이 파일들은 `.gitignore` 처리한다(Task 1). 절대 커밋하지 않는다.

---

## 파일 구조 (이 plan이 만지는 것)

| 파일 | 책임 | Task |
|---|---|---|
| `.env.dev` / `.env.prod` | 환경별 런타임 설정값 | 1 |
| `.env.example` | 키 계약 문서(커밋용) | 1 |
| `.gitignore` | `.env*` 제외 | 1 |
| `src/shared/config/__tests__/env.test.ts` | env 매핑 회귀 테스트 | 2 |
| `android/build.gradle` | google-services classpath | 3 |
| `android/app/build.gradle` | flavor + envConfigFiles + 플러그인 apply | 3,4 |
| `android/app/src/{dev,prod}/google-services.json` | 환경별 Firebase 설정 | 5 |
| `ios/Forceteller/AppDelegate.swift` | `FirebaseApp.configure()` | 7 |
| `ios/Podfile` | Build Config별 ENVFILE 매핑 | 8 |
| `ios/Forceteller.xcodeproj` | Build Configuration/scheme, Build Phase | 8,9,10 |
| `ios/Forceteller/Info.plist` | google-signin URL scheme | 10 |
| `ios/Forceteller/Firebase/GoogleService-Info-{Dev,Prod}.plist` | 환경별 Firebase 설정 | 9 |

---

### Task 1: `.env` 골격 + `.gitignore` + `.env.example`

**Files:**
- Create: `.env.dev`, `.env.prod`, `.env.example`
- Modify: `.gitignore`

- [ ] **Step 1: `.env.example` 작성 (키 계약, 커밋됨)**

```bash
# .env.example — 키 목록 문서. 실제 값은 .env.dev / .env.prod 에 넣고 커밋하지 않는다.
API_BASE_URL=
WEB_BASE_URL=
SPLASH_CONFIG_URL=
GOOGLE_WEB_CLIENT_ID=
MMKV_ENCRYPTION_KEY=
```

- [ ] **Step 2: `.env.dev` 작성 (실값 주입, 커밋 안 됨)**

```bash
# .env.dev
API_BASE_URL=<dev API base URL — 보유한 dev 서버 주소>
WEB_BASE_URL=https://forceteller.com  # PLACEHOLDER — 추후 확정
SPLASH_CONFIG_URL=https://static.forceteller.com/images/splash/splash.json
GOOGLE_WEB_CLIENT_ID=<dev Firebase Web client id>
MMKV_ENCRYPTION_KEY=<dev 전용 키 — 임의 생성 문자열>
```

- [ ] **Step 3: `.env.prod` 작성 (실값 주입, 커밋 안 됨)**

```bash
# .env.prod
API_BASE_URL=https://api.forceteller.com
WEB_BASE_URL=https://forceteller.com  # PLACEHOLDER — 추후 확정
SPLASH_CONFIG_URL=https://static.forceteller.com/images/splash/splash.json
GOOGLE_WEB_CLIENT_ID=<prod Firebase Web client id>
MMKV_ENCRYPTION_KEY=<prod 전용 키>
```

- [ ] **Step 4: `.gitignore`에 `.env*` 추가(예외: `.env.example`)**

`.gitignore` 끝에 추가:
```gitignore
# react-native-config 환경 파일 (실값 — 커밋 금지)
.env
.env.*
!.env.example
```

- [ ] **Step 5: 커밋**

```bash
git add .env.example .gitignore
git commit -m "chore(config): add .env.example contract and gitignore env files"
```
> `.env.dev`/`.env.prod`는 gitignore되어 add되지 않음 — 정상.

---

### Task 2: `env.ts` 매핑 회귀 테스트

`env.ts`는 이미 구현돼 있다(`Config.* ?? fallback`). 이 테스트는 dev/prod 분리 이후에도 매핑이 깨지지 않음을 고정한다.

**Files:**
- Create: `src/shared/config/__tests__/env.test.ts`
- Reference: `src/shared/config/env.ts`

- [ ] **Step 1: 실패 테스트 작성**

`react-native-config`는 빌드 시 주입되므로 테스트에선 mock한다. `env.ts`는 모듈 로드 시점에 `Config`를 읽어 상수로 고정하므로, `jest.resetModules()` + `jest.doMock`으로 주입값을 바꿔 재로딩한다.

```ts
// src/shared/config/__tests__/env.test.ts
describe('env', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('react-native-config 값을 그대로 매핑한다', () => {
    jest.doMock('react-native-config', () => ({
      __esModule: true,
      default: {
        API_BASE_URL: 'https://dev.api.example.com',
        WEB_BASE_URL: 'https://dev.web.example.com',
        SPLASH_CONFIG_URL: 'https://dev.cdn/splash.json',
        GOOGLE_WEB_CLIENT_ID: 'dev-client-id',
        MMKV_ENCRYPTION_KEY: 'dev-key',
      },
    }));
    const { env } = require('../env');
    expect(env.apiBaseUrl).toBe('https://dev.api.example.com');
    expect(env.googleWebClientId).toBe('dev-client-id');
    expect(env.mmkvEncryptionKey).toBe('dev-key');
  });

  it('값이 없으면 fallback을 쓴다', () => {
    jest.doMock('react-native-config', () => ({ __esModule: true, default: {} }));
    const { env } = require('../env');
    expect(env.apiBaseUrl).toBe('https://api.forceteller.com');
    expect(env.googleWebClientId).toBe('');
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm test -- env.test`
Expected: FAIL (모듈 경로/mock 형태가 맞지 않으면 우선 실패). mock 형태가 `env.ts`의 `import Config from 'react-native-config'` default import와 맞는지 확인.

- [ ] **Step 3: mock 형태를 import 방식에 맞춰 통과시키기**

`env.ts`가 `import Config from 'react-native-config'`(default import)이므로 mock의 `default` 키가 맞다. 위 mock이 통과해야 한다. 실패 시 `jest.config`의 `transformIgnorePatterns`/모듈 매핑을 확인(프로젝트 기존 mmkv mock 패턴 참고).

- [ ] **Step 4: 통과 확인**

Run: `pnpm test -- env.test`
Expected: PASS (2개)

- [ ] **Step 5: 전체 테스트 회귀 확인**

Run: `pnpm test`
Expected: 기존 40개 + 신규 2개 PASS

- [ ] **Step 6: 커밋**

```bash
git add src/shared/config/__tests__/env.test.ts
git commit -m "test(config): lock env mapping for dev/prod separation"
```

---

### Task 3: Android — google-services 플러그인 등록

**Files:**
- Modify: `android/build.gradle:14-18` (buildscript dependencies)
- Modify: `android/app/build.gradle` (맨 아래 apply)

- [ ] **Step 1: 루트 build.gradle에 classpath 추가**

`android/build.gradle`의 `buildscript { dependencies { ... } }` 블록(14-18줄)에 추가:
```gradle
        classpath("com.google.gms:google-services:4.4.2")
```
> 버전은 https://developers.google.com/android/guides/google-services-plugin 에서 현재 AGP 호환 최신을 확인. 4.4.2는 2024 기준 안정 버전.

- [ ] **Step 2: app/build.gradle 맨 아래에 플러그인 apply**

`android/app/build.gradle` 파일 **맨 끝**에 추가(dependencies 블록 이후):
```gradle
apply plugin: 'com.google.gms.google-services'
```

- [ ] **Step 3: 동기화만 확인(빌드는 Task 5 이후)**

이 시점엔 `google-services.json`이 없어 빌드가 실패하는 게 정상이다. Task 5에서 파일 배치 후 Task 6에서 빌드한다. 여기서는 Gradle 파일 문법만 검증:

Run: `cd android && ./gradlew help -q ; cd ..`
Expected: Gradle 설정 파싱 성공(태스크 목록 없이 BUILD SUCCESSFUL). `google-services.json` missing 에러는 `help`에선 나지 않음.

- [ ] **Step 4: 커밋**

```bash
git add android/build.gradle android/app/build.gradle
git commit -m "build(android): register google-services gradle plugin"
```

---

### Task 4: Android — 환경 flavor dimension + react-native-config 연동

**Files:**
- Modify: `android/app/build.gradle` (android 블록 + 상단 apply)

- [ ] **Step 1: flavor dimension + dev/prod flavor 추가**

`android/app/build.gradle`의 `android { ... }` 블록 안(`buildTypes` 근처)에 추가:
```gradle
    flavorDimensions "env"
    productFlavors {
        dev  { dimension "env" }   // applicationId 동일(suffix 없음)
        prod { dimension "env" }
    }
```

- [ ] **Step 2: react-native-config flavor→.env 매핑 + dotenv.gradle apply**

`android/app/build.gradle` 상단(`apply plugin: "com.android.application"` 부근, react gradle plugin apply 다음)에 추가:
```gradle
project.ext.envConfigFiles = [
    dev:  ".env.dev",
    prod: ".env.prod",
]
apply from: project(':react-native-config').projectDir.getPath() + "/dotenv.gradle"
```
> `:react-native-config` 경로가 settings.gradle에 등록돼 있어야 한다(expo autolinking이 등록). 미등록으로 실패하면 직접 경로 사용:
> `apply from: "../../node_modules/react-native-config/android/dotenv.gradle"`

- [ ] **Step 3: 설정 파싱 확인**

Run: `cd android && ./gradlew :app:tasks -q --console=plain | grep -i assemble ; cd ..`
Expected: `assembleDevDebug`, `assembleProdRelease` 등 **flavor×buildType variant 태스크**가 목록에 나타남. 이것으로 flavor 정의 성공을 확인한다.

- [ ] **Step 4: 커밋**

```bash
git add android/app/build.gradle
git commit -m "build(android): add env flavor dimension + react-native-config mapping"
```

---

### Task 5: Android — google-services.json 배치 (dev/prod)

**Files:**
- Create: `android/app/src/dev/google-services.json` (dev Firebase 콘솔에서)
- Create: `android/app/src/prod/google-services.json` (prod Firebase 콘솔에서)

- [ ] **Step 1: dev 파일 배치**

dev Firebase 콘솔에서 받은 `google-services.json`을 `android/app/src/dev/google-services.json`에 둔다. 내부 `package_name`이 `com.un7qi3i.forceteller`인지 확인(없으면 콘솔에서 해당 패키지로 Android 앱 등록 후 재다운로드).

- [ ] **Step 2: prod 파일 배치**

prod 콘솔의 `google-services.json`을 `android/app/src/prod/google-services.json`에 둔다. 동일 패키지명 확인.

- [ ] **Step 3: 두 파일이 다른 project_id를 가리키는지 확인**

Run: `grep -h '"project_id"' android/app/src/dev/google-services.json android/app/src/prod/google-services.json`
Expected: 서로 **다른** project_id 두 줄.

- [ ] **Step 4: gitignore 확인(민감 파일)**

google-services.json은 OAuth client 정보를 담는다. 커밋 정책은 팀 관례를 따른다 — 이 plan은 기본적으로 **커밋하지 않음**으로 가정하고 `.gitignore`에 추가:
```gitignore
# Firebase 환경별 설정 (커밋 금지)
android/app/src/dev/google-services.json
android/app/src/prod/google-services.json
```

- [ ] **Step 5: 커밋(.gitignore만)**

```bash
git add .gitignore
git commit -m "chore(android): gitignore per-flavor google-services.json"
```

---

### Task 6: Android — 빌드 검증 (devDebug / prodRelease)

**Files:** 없음(검증 전용)

- [ ] **Step 1: dev 디버그 빌드**

Run: `cd android && ./gradlew assembleDevDebug -q ; cd ..`
Expected: BUILD SUCCESSFUL. google-services 플러그인이 `src/dev/google-services.json`을 읽어 dev Firebase 리소스 생성.

- [ ] **Step 2: prod 릴리스 빌드**

Run: `cd android && ./gradlew assembleProdRelease -q ; cd ..`
Expected: BUILD SUCCESSFUL. `src/prod/google-services.json` 사용.

- [ ] **Step 3: .env 주입 + flavor 키 매칭 확인 (검증 필요 항목)**

dev 빌드를 기기/에뮬레이터에서 실행하고, JS에서 `env.apiBaseUrl`이 `.env.dev`의 dev API URL인지 확인(임시 `console.log(env)` 또는 디버거).
- 만약 dev 빌드인데 `.env.prod` 값이 들어오면 → `envConfigFiles`의 flavor 키 매칭 실패. 키를 variant 전체 이름(`devDebug`, `devRelease`, `prodDebug`, `prodRelease`)으로 바꿔 재시도(Task 4 Step 2 수정).

- [ ] **Step 4: 생성된 리소스의 project_id 확인**

Run: `grep -r "project_id\|google_app_id" android/app/build/generated/res/google-services/dev/ 2>/dev/null | head`
Expected: dev project_id 값 등장(빌드 산출물에 dev Firebase가 반영됨).

- [ ] **Step 5: 커밋 없음(검증 단계)**

빌드 산출물은 커밋하지 않는다. 문제 발견 시 해당 Task로 돌아가 수정.

---

### Task 7: iOS — AppDelegate Firebase 초기화

**Files:**
- Modify: `ios/Forceteller/AppDelegate.swift:1-6, 15-18`

- [ ] **Step 1: Firebase import 추가**

`AppDelegate.swift` import 블록(1-6줄)에 추가:
```swift
import FirebaseCore
```

- [ ] **Step 2: `FirebaseApp.configure()` 호출**

`didFinishLaunchingWithOptions`의 본문 **맨 처음**(19줄 `let delegate = ...` 직전)에 추가:
```swift
    FirebaseApp.configure()
```
> 번들에 포함된 `GoogleService-Info.plist`를 자동 탐색해 default app을 초기화한다. plist는 Task 9에서 환경별로 배치한다.

- [ ] **Step 3: pod 재설치 + 컴파일 확인**

Run: `cd ios && pod install ; cd ..`
Expected: 성공. FirebaseCore는 이미 RNFBApp 의존으로 설치돼 있음(Podfile.lock의 Firebase/Auth 12.15.0).
이 시점엔 plist가 없어 런타임 크래시가 날 수 있으나, **컴파일**은 통과해야 한다. 빌드는 Task 9 이후.

- [ ] **Step 4: 커밋**

```bash
git add ios/Forceteller/AppDelegate.swift
git commit -m "feat(ios): configure Firebase default app in AppDelegate"
```

---

### Task 8: iOS — Build Configuration + scheme + Podfile ENVFILE 매핑

iOS는 flavor가 없으므로 **Build Configuration**으로 환경을 가른다. 환경×빌드타입 독립을 위해 기존 `Debug`/`Release`를 환경별로 복제한다.

**Files:**
- Modify: `ios/Forceteller.xcodeproj` (Build Configurations, schemes — Xcode UI)
- Modify: `ios/Podfile:51-58` (post_install)

- [ ] **Step 1: Build Configuration 복제 (Xcode)**

Xcode → 프로젝트 → Info → Configurations에서 복제:
- `Debug` → `Debug-dev`, `Debug-prod`
- `Release` → `Release-dev`, `Release-prod`
(원본 `Debug`/`Release`는 삭제하지 않아도 무방하나, scheme이 새 4개만 쓰도록 구성)

- [ ] **Step 2: scheme 2개 생성 (Xcode)**

- `Forceteller Dev`: Run=`Debug-dev`, Archive=`Release-dev`
- `Forceteller`(기존): Run=`Debug-prod`, Archive=`Release-prod`
두 scheme 모두 **Shared** 체크(팀 공유).

- [ ] **Step 3: Podfile post_install에 ENVFILE 매핑 추가**

`ios/Podfile`의 `post_install do |installer|` 블록(51줄) 안, `react_native_post_install(...)` 호출 다음에 추가:
```ruby
    envfiles = {
      'Debug-dev'  => '$(PODS_ROOT)/../../.env.dev',
      'Release-dev'=> '$(PODS_ROOT)/../../.env.dev',
      'Debug-prod' => '$(PODS_ROOT)/../../.env.prod',
      'Release-prod'=> '$(PODS_ROOT)/../../.env.prod',
    }
    installer.pods_project.targets.each do |target|
      if target.name == 'react-native-config'
        target.build_configurations.each do |config|
          config.build_settings['ENVFILE'] = envfiles[config.name] if envfiles[config.name]
        end
      end
    end
```
> 공식 react-native-config 패턴(Build Configuration별 ENVFILE). 키 이름은 Step 1에서 만든 Configuration 이름과 정확히 일치해야 한다.

- [ ] **Step 4: pod 재설치 + 설정 확인**

Run: `cd ios && pod install ; cd ..`
Expected: 성공. `react-native-config` 타겟의 각 Configuration에 ENVFILE 빌드세팅이 들어감.

- [ ] **Step 5: 커밋**

```bash
git add ios/Podfile ios/Forceteller.xcodeproj/project.pbxproj ios/Forceteller.xcodeproj/xcshareddata
git commit -m "build(ios): add dev/prod build configs, schemes, ENVFILE mapping"
```

---

### Task 9: iOS — GoogleService-Info plist 배치 + Build Phase 선택

**Files:**
- Create: `ios/Forceteller/Firebase/GoogleService-Info-Dev.plist` (dev 콘솔)
- Create: `ios/Forceteller/Firebase/GoogleService-Info-Prod.plist` (prod 콘솔)
- Modify: `ios/Forceteller.xcodeproj` (Run Script Build Phase)

- [ ] **Step 1: plist 2개 배치**

dev/prod iOS 콘솔에서 받은 plist를 각각 `GoogleService-Info-Dev.plist`, `GoogleService-Info-Prod.plist`로 `ios/Forceteller/Firebase/`에 둔다. 두 파일을 Xcode 프로젝트에 추가하되 **"Copy Bundle Resources"에는 넣지 않는다**(아래 스크립트가 활성 환경 것만 복사).

- [ ] **Step 2: Build Phase 선택 스크립트 추가 (Xcode → Build Phases → New Run Script)**

`FirebaseApp.configure()`가 자동 탐색하는 이름은 `GoogleService-Info.plist`이므로, 활성 Configuration에 맞는 plist를 그 이름으로 복사한다. **"Compile Sources"보다 앞**에 배치:
```bash
ENV_SUFFIX="Prod"
case "${CONFIGURATION}" in
  *-dev) ENV_SUFFIX="Dev" ;;
  *-prod) ENV_SUFFIX="Prod" ;;
esac
SRC="${PROJECT_DIR}/Forceteller/Firebase/GoogleService-Info-${ENV_SUFFIX}.plist"
DEST="${BUILT_PRODUCTS_DIR}/${PRODUCT_NAME}.app/GoogleService-Info.plist"
echo "Using Firebase plist: ${SRC}"
cp "${SRC}" "${DEST}"
```
> ⚠️ **검증 필요**: 멀티 plist 선택은 공식 멀티 가이드가 없는 커스텀 패턴. 복사 타이밍(`${BUILT_PRODUCTS_DIR}` 존재 시점)이 안 맞으면, plist를 빌드 산출물 대신 소스 위치로 복사하는 pre-action 방식으로 대체.

- [ ] **Step 3: dev scheme 빌드로 검증**

Run: Xcode에서 `Forceteller Dev` scheme 선택 → Build
Expected: 성공. 빌드 로그에 `Using Firebase plist: .../GoogleService-Info-Dev.plist`.

- [ ] **Step 4: .gitignore + 커밋**

```gitignore
# iOS Firebase 환경별 plist (커밋 금지)
ios/Forceteller/Firebase/GoogleService-Info-Dev.plist
ios/Forceteller/Firebase/GoogleService-Info-Prod.plist
```
```bash
git add .gitignore ios/Forceteller.xcodeproj/project.pbxproj
git commit -m "build(ios): select GoogleService-Info plist per configuration"
```

---

### Task 10: iOS — google-signin reversed client id URL scheme (환경별)

dev/prod Firebase가 다르면 iOS OAuth client(따라서 `REVERSED_CLIENT_ID`)도 다르다. google-signin은 이 값을 URL scheme으로 요구한다.

**Files:**
- Modify: `ios/Forceteller/Info.plist` (CFBundleURLTypes)
- Modify: `ios/Forceteller.xcodeproj` (xcconfig 또는 User-Defined Build Setting)

- [ ] **Step 1: 각 plist의 REVERSED_CLIENT_ID 확인**

Run: `plutil -extract REVERSED_CLIENT_ID raw ios/Forceteller/Firebase/GoogleService-Info-Dev.plist ; plutil -extract REVERSED_CLIENT_ID raw ios/Forceteller/Firebase/GoogleService-Info-Prod.plist`
Expected: 서로 다른 `com.googleusercontent.apps.XXXX` 두 값.

- [ ] **Step 2: User-Defined Build Setting으로 환경별 값 정의 (Xcode)**

Xcode → Target → Build Settings → `+` User-Defined → `REVERSED_CLIENT_ID`:
- `Debug-dev`/`Release-dev` = dev 값
- `Debug-prod`/`Release-prod` = prod 값

- [ ] **Step 3: Info.plist에 URL scheme 변수 주입**

`ios/Forceteller/Info.plist`의 `CFBundleURLTypes`에 항목 추가(없으면 배열 생성):
```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>$(REVERSED_CLIENT_ID)</string>
    </array>
  </dict>
</array>
```

- [ ] **Step 4: dev/prod 빌드 각각에서 URL scheme 확인**

Run: dev scheme 빌드 후 `plutil -extract CFBundleURLTypes.0.CFBundleURLSchemes.0 raw "${BUILT_APP}/Info.plist"`
Expected: dev REVERSED_CLIENT_ID 값. prod scheme 빌드 시 prod 값.
> ⚠️ **검증 필요**: `$(VAR)` 치환이 Info.plist에 빌드타임 반영되는지 확인. 안 되면 Build Phase에서 plist의 REVERSED_CLIENT_ID를 읽어 앱 Info.plist에 주입하는 스크립트로 대체.

- [ ] **Step 5: 커밋**

```bash
git add ios/Forceteller/Info.plist ios/Forceteller.xcodeproj/project.pbxproj
git commit -m "feat(ios): inject reversed client id URL scheme per environment"
```

---

### Task 11: iOS — 통합 빌드 검증

**Files:** 없음(검증 전용)

- [ ] **Step 1: dev scheme 실행**

Run: Xcode `Forceteller Dev` scheme → 시뮬레이터 실행
Expected: 앱 부팅, Firebase 초기화 크래시 없음. JS에서 `env.apiBaseUrl`이 dev API.

- [ ] **Step 2: prod scheme 실행**

Run: Xcode `Forceteller` scheme → 실행
Expected: 부팅 정상, `env.apiBaseUrl`이 `https://api.forceteller.com`.

- [ ] **Step 3: 커밋 없음(검증 단계)**

---

### Task 12: 통합 검증 — dev/prod google-signin 로그인

이 Task는 인증 게이트 재활성화 전 마지막 관문이다. dev Firebase에 로그인이 실제로 꽂히는지 확인한다.

**Files:** 없음(수동 검증). 참고: `src/features/auth/providers/google-provider.ts`, `firebase.ts`

- [ ] **Step 1: dev 로그인 e2e**

dev 빌드(Android `devDebug` 또는 iOS `Forceteller Dev`)에서 Google 로그인 시도 → Firebase ID 토큰 발급 → 서버 교환까지 흐름 확인. **dev Firebase 콘솔 → Authentication → Users**에 테스트 계정이 dev 프로젝트에 생기는지 확인(prod가 아니라 dev에 격리됨).

- [ ] **Step 2: prod 격리 확인**

prod 빌드로 로그인 시 prod Firebase 콘솔에 사용자가 생기고, dev 콘솔엔 안 생기는지 확인.

- [ ] **Step 3: 회귀 — 게스트 흐름 유지**

`ROUTE_GUARDS = {}`(현재 비활성)이므로 게스트가 Web 등 보호 페이지에 그대로 진입 가능해야 한다(회귀 0). 게이트 재활성화는 이 plan 범위 밖(인증 plan에서).

- [ ] **Step 4: 최종 커밋(문서/잔여)**

```bash
git add -A
git commit -m "docs(env): finalize dev/prod separation verification notes"
```

---

## 미해소 / 범위 밖 (명시)

- **(2026-07-03 실행 중 발견·해결) iOS static frameworks 전환**: RNFB(firebase-ios-sdk v9+)는 `use_frameworks! :linkage => :static` + `$RNFirebaseAsStaticFramework = true`가 필수(rnfirebase.io). 기존 정적 라이브러리+modular_headers 구성으론 `Firebase.h`의 `<FirebaseAuth/FirebaseAuth-Swift.h>` 해석이 불가능해 **RNFB 도입 이후 iOS 빌드가 성공한 적이 없었음**. Podfile 전환 + `CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES=YES`(프리빌트 React-Core 조합의 알려진 이슈, RNFB#6933) + AppDelegate의 `React_RCTAppDelegate` import 제거(frameworks 모드에선 Expo 호환 modulemap이 단일 `React` 모듈만 노출)로 해결. 참고: FirebaseCore CocoaPods 배포는 2026-10 이후 중단 예정 — SPM 전환 로드맵 별도 필요.

- **release 서명**: 현재 `release`가 `debug.keystore`로 임시 서명(`android/app/build.gradle:108`). prod 정식 keystore는 별도 작업.
- **국가축**: `flavorDimensions "env", "country"`로 확장 예정 — 이 plan 범위 밖.
- **인증 게이트 재활성화**(`ROUTE_GUARDS = { Web: { requiresAuth: true } }`): 이 plan 검증 통과 후 인증 plan에서 수행.
- **검증 필요 항목 3개**(Task 4 flavor 키 매칭, Task 9 plist 선택, Task 10 reversed client id 주입)는 실빌드 결과에 따라 명시된 fallback으로 조정.

## 권장 실행 순서

Task 1→2(JS, 자동 검증 가능) → 3→4→5→6(Android, 빌드 검증) → 7→8→9→10→11(iOS, Xcode 작업 많음) → 12(통합). iOS Task(8~10)는 Xcode GUI 작업이 포함돼 자동화가 어렵다 — 구현자가 직접 수행/검증.
