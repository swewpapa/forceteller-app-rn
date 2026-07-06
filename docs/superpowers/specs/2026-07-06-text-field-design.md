# TextField 컴포넌트 설계

2026-07-06 · 브레인스토밍 확정본. Figma를 ground truth로 구현. [component-prop-conventions.md](../../design-system/component-prop-conventions.md) 준수, [Typography](2026-07-03-typography-component-design.md)·[layout](2026-07-03-layout-primitives-design.md)·[Button](2026-07-03-button-component-design.md)에 이은 **토큰 소비 컴포넌트 패턴 4호**. form 컴포넌트 패밀리(TextField → Field 래퍼 → Checkbox → Chip/ChipGroup)의 첫 컴포넌트.

## 목적

디자인 시스템 TextField(단일 라인 입력 박스)를 구현한다. Figma 변수가 우리 토큰과 이름 기준 1:1 대응하므로 시맨틱 매핑으로 시각을 재현한다.

## Figma 출처

| 노드 | 파일 | 시사점 |
|---|---|---|
| `118:6404` | Component Library | **정본** — 5상태(Default/Focused/Typing/Entered/Error), 클리어(circle-xmark), 치수/토큰 |
| `106:3305` | 앱 전체화면 | 실사용 상태 스택(기본/입력값/포커스 빈·채움) |
| `106:3382` | 앱 전체화면 | SearchField(검색 아이콘) — 본 컴포넌트 + 아이콘 슬롯으로 흡수 |
| `106:3419` | 앱 전체화면 | 라벨+필드+에러메시지 = **Field 래퍼**(별도 컴포넌트, 다음 사이클) |

## 범위 (Martin 확정)

**이번 사이클 — TextField 입력 박스만**: controlled 입력 + 상태(default·focused·error·disabled) + placeholder + `clearable`(클리어 버튼) + `leading`/`trailing` 슬롯.

**범위 밖(후속)**:
- **Field 래퍼**(Label + 컨트롤 + Helper/Error) — form 패밀리 2호. TextField를 감싸는 재사용 조합.
- **SearchField** — 별도 컴포넌트 아님. `<TextField leading={<FontAwesomeIcon icon={faMagnifyingGlass}/>} />`로 조립.
- Checkbox, Chip/ChipGroup(form 패밀리 3·4호), "시간 모름" 앱 조합(Field+TextField+Checkbox).
- 다중 사이즈(Figma는 h48 단일), multiline/TextArea.

## 아이콘 시스템 (기확보 — 중요)

앱에 **Font Awesome Pro가 이미 설치·사용 중**이다: `@fortawesome/react-native-fontawesome`, `@fortawesome/pro-solid-svg-icons`, `pro-light-svg-icons`, `react-native-svg`. `src/app/navigation/tab-bar.tsx`가 `FontAwesomeIcon` + `faHouse`(deep import)를 이미 사용. **Figma가 쓰는 바로 그 패밀리**라 아이콘을 1:1 재현할 수 있다. (Button 사이클의 "아이콘 시스템 없음" 가정은 오류였음 — 실제 존재.)

- 아이콘 import는 tab-bar 관례 따라 **per-icon deep import**(트리셰이킹): `import { faCircleXmark } from '@fortawesome/pro-solid-svg-icons/faCircleXmark';`
- 얇은 `Icon` 래퍼 컴포넌트(토큰 size/color 표준화)는 **후속 검토** — TextField는 `FontAwesomeIcon`을 내부에서 직접 쓰고, 슬롯은 ReactNode라 호출측이 `FontAwesomeIcon`을 넣는다.

## 컴포넌트 API

```ts
type TextFieldProps = Omit<
  TextInputProps,
  'style' | 'value' | 'onChangeText' | 'placeholder' | 'placeholderTextColor' | 'editable' | 'onFocus' | 'onBlur'
> & {
  value: string;                       // controlled (필수)
  onChangeText: (text: string) => void; // controlled (필수)
  placeholder?: string;
  error?: boolean;                      // default false — 빨간 테두리
  disabled?: boolean;                   // default false — editable=false + 회색
  clearable?: boolean;                  // default true — 포커스+값 있을 때 클리어(circle-xmark), disabled면 숨김
  leading?: ReactNode;                  // 선행 슬롯(예: 검색 아이콘)
  trailing?: ReactNode;                 // 후행 슬롯
  onFocus?: (e: NativeSyntheticEvent<TextInputFocusEventData>) => void; // 내부 포커스 추적 후 호출측에도 전달
  onBlur?: (e: NativeSyntheticEvent<TextInputFocusEventData>) => void;
  /** 컨테이너 레이아웃 전용 탈출구(margin/width 등). 병합 마지막. */
  style?: StyleProp<ViewStyle>;
};
```

**규약 준수**: `Omit<TextInputProps, ...관리항목> & {...}` 패스스루(keyboardType·secureTextEntry·maxLength·returnKeyType 등 자동 통과), boolean 긍정+default false, `leading`/`trailing` 슬롯, `style` 레이아웃 탈출구.

- **관리 항목(Omit 후 재정의/제어)**: `value`/`onChangeText`(controlled 계약), `placeholder`/`placeholderTextColor`(색은 토큰이 소유), `editable`(disabled에서 파생), `onFocus`/`onBlur`(내부 포커스 상태 추적 — 호출측 콜백은 래핑해 그대로 호출), `style`(컨테이너 레이아웃 탈출구로 재정의). 이는 규약 §5 "컴포넌트가 파생·제어하는 prop도 Omit" 적용.
- **controlled 전용**(Martin 결정): `value`/`onChangeText` 필수. 폼 상태는 상위가 소유.

## 상태 해석 (mode-colors 시맨틱 매핑)

런타임 상태 = (`error`, `focused`(내부), `disabled`) 조합. 우선순위: disabled > error > focused > default.

| 상태 | 테두리(borderColor) | 입력 텍스트 | placeholder | 배경 |
|---|---|---|---|---|
| default | `stroke.default` | `text.default` | `text.muted` | `background.surface` |
| focused | `primary.primary` | `text.default` | `text.muted` | `background.surface` |
| error | `stroke.alert` | `text.default` | `text.muted` | `background.surface` |
| disabled | `stroke.default` | `text.muted` | `text.muted` | `background.inset` |

- error는 focused보다 우선(에러 중 포커스해도 빨간 테두리 유지). disabled가 최우선.
- **disabled 시각은 Figma Component Library에 정의 없음** — 앱 노드(3482)의 회색 필드를 근거로 `background.inset`+`text.muted`로 정의. **구현 후 디자인 확인 항목**(Button md 보간과 동일 성격).
- placeholder는 항상 `text.muted`.

## 클리어 버튼 (Martin 위임 → 결정: `clearable` prop + 실제 FA 아이콘)

- `clearable && focused && value.length > 0 && !disabled`일 때 후행에 클리어 버튼 표시(Figma "Typing" 상태와 동일 조건 — blur+값(Entered)엔 없음). **disabled면 숨김**(Martin 확정 — disabled 시 editable=false라 포커스도 안 잡히지만 조건에 명시).
- 렌더: `Pressable` + `<FontAwesomeIcon icon={faCircleXmark} size={16} color={colors.text.subtle} />` (Figma: circle-xmark, 16px, `text.subtle` #686868). 터치 영역 24px.
- onPress → `onChangeText('')` 후 입력 유지(포커스 보존). `accessibilityRole="button"`, `accessibilityLabel="지우기"`.
- **기본값 `true`(Martin 확정)** — Figma 정본이 Typing 상태에 클리어를 기본 노출하는 것과 일치. 클리어가 불필요한 필드는 `clearable={false}`로 끈다.

## 치수 / 토큰 (Figma)

- 높이 48(`spacing[600]`), paddingHorizontal 16(`spacing[200]`), radius `radius.md`(8), borderWidth 1
- 슬롯/입력/클리어 간 gap 8(`spacing[100]`)
- 타이포: **body-lg**(16/24, weight 400) — `typographyStyles['body-lg']`를 TextInput style에 적용(Button이 label 타이포를 typographyStyles로 쓴 것과 동일 수법)
- 세로 정렬: 높이 48 고정 + `alignItems:'center'`(body-lg lineHeight 24가 중앙 정렬, Figma의 py12+items-start와 시각 등가)

## 구현 방식 (순수 리졸버 + 얇은 컴포넌트 — 기존 패턴 계승)

**`text-field-style.ts`** — 순수 함수:
```ts
type TextFieldStyleState = { error: boolean; focused: boolean; disabled: boolean };
type TextFieldStyle = {
  container: ViewStyle;      // height, px, borderRadius, borderWidth, borderColor, backgroundColor,
                             // flexDirection:'row', alignItems:'center', gap
  inputColor: string;        // 입력 텍스트 색
  placeholderColor: string;  // placeholder 색
};
function buildTextFieldStyle(state: TextFieldStyleState, colors: ModeColors): TextFieldStyle
```
- 색/치수 매핑을 이 함수에 집중. focus/clear 표시 여부·이벤트는 런타임이라 컴포넌트에서.

**`text-field.tsx`** — 컴포넌트:
- 루트 `View`(container 스타일) > [`leading`] + `TextInput`(flex 1) + [`trailing`] + [클리어 버튼].
- 내부 `const [focused, setFocused] = useState(false)`. `onFocus`/`onBlur`에서 setFocused + 호출측 콜백 호출.
- `TextInput`: `value`/`onChangeText` 그대로, `placeholder`, `placeholderTextColor={placeholderColor}`, `editable={!disabled}`, `style={[typographyStyles['body-lg'], { color: inputColor, flex: 1, padding: 0 }]}`(RN 기본 padding 제거), `{...rest}` 패스스루.
- 클리어 버튼: 위 조건일 때만. `React 19`라 ref는 rest로 전달(TextInput ref 필요 시).
- 컨테이너 병합: `[buildTextFieldStyle(...).container, style]`(사용자 style 마지막).

## 파일 구조

```
src/shared/components/text-field/
  text-field-style.ts          # 타입 + buildTextFieldStyle 순수 함수
  text-field.tsx               # 컴포넌트
  index.ts                     # barrel
  __tests__/text-field-style.test.ts
```
- kebab-case 파일 + PascalCase export(`TextField`).
- `src/shared/components/index.ts`에 `TextField` + prop 타입 export 추가.
- `body-lg`가 `typographyStyles`에 있는지 확인(Typography codegen 산출물 — 존재). `typographyStyles`는 이미 `typography` 배럴에 노출됨(Button 때).

## 테스트 전략

repo 관례(순수 로직 유닛테스트). `text-field-style.test.ts`로 `buildTextFieldStyle` 검증:
1. default → border stroke.default, inputColor text.default, placeholder text.muted, bg surface
2. focused → border primary.primary
3. error → border stroke.alert
4. error + focused → border stroke.alert(에러 우선)
5. disabled → border stroke.default, bg inset, inputColor text.muted (disabled 최우선: disabled+error여도 disabled 스타일)
6. 공통 컨테이너: height 48, paddingHorizontal 16, borderRadius 8, borderWidth 1, flexDirection row, alignItems center, gap 8

컴포넌트 렌더(포커스 전환/클리어/슬롯/controlled)는 시뮬레이터 시각 검증.

## 첫 실사용

현재 앱에 텍스트 입력 화면이 없음(웹뷰 기반, `TextInput` 사용처 0). **첫 실사용 없음** — 컴포넌트만 추가하고, Field 래퍼(다음 사이클) 또는 실제 폼 화면이 생길 때 소비. 검증은 리졸버 유닛테스트 + 시뮬레이터 임시 렌더(스크린샷 후 되돌림).

## 사이드이펙트 검토

1. 신규 컴포넌트 추가만 — 기존 화면/컴포넌트 영향 없음(소비처 0).
2. `FontAwesomeIcon`/`react-native-svg`는 이미 설치·사용 중(tab-bar) — 신규 의존성 없음.
3. barrel 확장은 기존 구조와 동일(순환 없음): text-field는 `@/shared/theme`·`../typography`(typographyStyles)·FA만 참조.
4. controlled 전용이라 소비 시 상위가 상태 관리 — 규약대로.

## 범위 밖 / 후속 (form 패밀리 로드맵)

- **Field 래퍼**(Label+Helper/Error) — 다음, SearchField 조립 예시 포함
- Checkbox, Chip/ChipGroup
- 얇은 `Icon` 래퍼(토큰 size/color 표준화), Button 슬롯에 FA 아이콘 실적용(login 화살표 등)
- 다중 사이즈, multiline, secure 토글(비밀번호 표시), 문자수 카운터

## 실행 노트

- 브랜치: main 최신에서 `feature/text-field` 분기. push/commit은 명시 요청 시에만.
