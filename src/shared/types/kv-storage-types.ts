/**
 * MMKV 부분 인터페이스 — storage 모듈이 의존하는 최소 KV 계약(DI로 테스트에서 fake 주입).
 * 구현체(MMKV 인스턴스)와의 구조 호환은 각 모듈의 싱글턴 배선 지점에서 컴파일러가 검증한다.
 * 값은 문자열 직렬화 전용 — boolean 등 다른 값 타입이 필요하면 공용 계약을 넓히지 말고
 * 모듈 로컬 계약을 정의한다(popover-dismiss의 `BoolKV` 선례).
 */
export type KVStorage = {
  getString(key: string): string | undefined;
  set(key: string, value: string): void;
  remove(key: string): void;
};
