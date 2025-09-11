/**
 * 작업의 결과를 나타내는 타입으로, 성공 시 [결과, null]을, 실패 시 [null, 에러]를 반환합니다.
 * @template T 성공 시의 결과 값 타입
 */
export type Failable<T> = [T | null, Error | null];
