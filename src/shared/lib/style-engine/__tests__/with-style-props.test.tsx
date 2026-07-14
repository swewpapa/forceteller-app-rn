import { View } from 'react-native';
import { withStyleProps } from '@/shared/lib/style-engine/with-style-props';
import { background } from '@/shared/lib/style-engine/resolvers/background';
import { radius } from '@/shared/lib/style-engine/resolvers/radius';

const Styled = withStyleProps(View, { resolvers: { color: background, radius } });

describe('withStyleProps', () => {
  it('displayName — 베이스 식별 유지(devtools)', () => {
    // RN View는 displayName='View'를 직접 지정(View.js) — jest 환경 실측값 기준.
    expect(Styled.displayName).toBe('withStyleProps(View)');
  });
});

/**
 * 컴파일 계약(TokenPropsOf 추론). 호출하지 않는 함수라 런타임 실행은 없다.
 * 아래 @ts-expect-error 라인이 에러가 아니게 되면(누군가 타입을 넓히면)
 * "Unused '@ts-expect-error' directive"로 tsc 자체가 실패해 회귀를 잡는다.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function compileTimeContract() {
  /* eslint-disable no-void -- 미사용 JSX 표현식의 컴파일 계약 참조 */
  // 정상: 바인딩된 prop + 올바른 토큰 키는 에러 없이 통과
  void (<Styled color="surface" radius="md" />);
  // @ts-expect-error — 잘못된 토큰 키 거부 (TokenPropsOf 추론)
  void (<Styled color="wrong-key" />);
  // @ts-expect-error — 미바인딩 prop 거부
  void (<Styled gap="100" />);
  /* eslint-enable no-void */
}
