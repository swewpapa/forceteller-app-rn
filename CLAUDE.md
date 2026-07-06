# CLAUDE.md — 포스텔러 RN

작업 전 참조할 규약 문서 (상세는 문서가 SSOT, 여기는 요약):

- **`docs/architecture.md`** — 아키텍처·네이밍 SSOT (3-레이어, 파일 네이밍, 계층별 네이밍 언어, API 레이어 패턴)
- **`docs/design-system/component-prop-conventions.md`** — DS 컴포넌트 prop 규약 (color/appearance/variant, Form 접두사 등)

## 핵심 규칙 요약

- **레이어 단방향**: shared → features → app. features끼리 import 금지, feature 외부에서는 barrel(`index.ts`) 경유.
- **파일 네이밍**: kebab-case + 타입 접미사(`-screen`/`-store`/`-api`/`-types`), export 심볼은 PascalCase. 훅만 `useX.ts`.
- **계층별 네이밍 언어**: API 메서드/훅은 API-친화적(`listByCode`, `useThemeListByCode`) — "어떻게 조회하는가". 타입/컴포넌트는 도메인 개념(`ThemeWidget`, `ThemeView`) — "무엇인가". HTTP 라우트 어휘를 프레젠테이션에 새지 않게.
- **theme 도메인 어휘**: 위젯 컨텍스트(`/api/theme/list/{code}`) = `ThemeWidget*`, 페이지 컨텍스트(`/api/theme/{id}`) = `Theme`/`ThemePage`(예약). `ThemeList`는 중의적이라 금지.
- **API 레이어**: `create<Domain>Api(client)` 팩토리 + 싱글턴 export. raw 응답 타입은 `api/` 밖 반출 금지 — normalize 순수함수로 도메인 discriminated union 변환, unknown type은 드롭.
- **데이터 페칭**: 스크린이 훅 호출(컨테이너), 하위 컴포넌트는 presentational(props만).
- **git**: main 직접 커밋 금지(브랜치 → PR → Martin 검수 → 머지). 커밋은 명시 요청 시에만, push는 절대 임의로 하지 않는다.
