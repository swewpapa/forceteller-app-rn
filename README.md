# 포스텔러 (forceteller-app-rn)

기존 Ionic/Angular/Capacitor 앱(`forceteller-app`)을 React Native로 옮기기 위한 **개발 토대**. bare React Native (Community CLI) + TypeScript, pnpm, 도메인 베이스 구조.

> 구조·네이밍·의존성 규칙은 [`docs/architecture.md`](docs/architecture.md) 참고.

## Prerequisites

- **Node** ≥ 22.11 (`.nvmrc` 미설정, 22.x 권장)
- **pnpm** — corepack으로 활성화: `corepack enable pnpm` (버전은 `package.json`의 `packageManager`가 고정)
- **watchman** — Metro 파일 와칭에 필요. 현재 머신은 `icu4c` dylib 로드 실패 상태이니 실행 전 `brew reinstall watchman` 필요할 수 있음
- **iOS** — Xcode + CocoaPods. `pod install` 시 `export LANG=en_US.UTF-8`가 필요할 수 있음

## Install

```sh
corepack enable pnpm
pnpm install
```

## Run

```sh
# 1) Metro 시작
pnpm start

# 2) 다른 터미널에서 플랫폼 실행
pnpm android

# iOS는 최초 1회 pod 설치 후 실행
cd ios && bundle install && bundle exec pod install && cd ..
pnpm ios
```

## Scripts

| 스크립트 | 설명 |
|---|---|
| `pnpm start` | Metro 번들러 |
| `pnpm android` / `pnpm ios` | 디바이스/시뮬레이터 실행 |
| `pnpm lint` | ESLint (도메인 경계 규칙 포함) |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | Jest |

## 구조 (요약)

```
src/
├─ app/        # 엔트리·providers·navigation 루트
├─ features/   # 도메인 모듈 (horoscope, compatibility, premium, profile, search)
└─ shared/     # 공용 (components, lib, config, theme, types, utils)
```

의존성은 **shared → features → app** 단방향으로 ESLint(`import/no-restricted-paths`)가 강제한다. 자세한 규칙·네이밍 컨벤션은 [`docs/architecture.md`](docs/architecture.md).
