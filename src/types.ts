/**
 * 작업의 결과를 나타내는 타입으로, 성공 시 [결과, null]을, 실패 시 [null, 에러]를 반환합니다.
 * @template T 성공 시의 결과 값 타입
 */
export type Failable<T> = [T | null, Error | null];

/**
 * API 응답의 표준 형식을 정의합니다.
 * @template T 응답 데이터의 타입
 */
export type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data?: T;
};

// JWT 페이로드의 타입을 정의합니다.
// 실제 토큰에 포함된 정보에 따라 이 인터페이스를 확장해야 합니다.
export interface DecodedToken {
  userId: string; // 예시: 토큰에 사용자 ID가 포함되어 있다고 가정
  // 다른 클레임(예: roles, email 등)을 여기에 추가할 수 있습니다.
  iat?: number; // Issued At
  exp?: number; // Expiration Time
}

// Express Request 객체에 user 속성을 추가하기 위한 타입 확장
// 이 확장은 프로젝트의 다른 파일(예: src/types.ts 또는 별도의 d.ts 파일)에 두는 것이 더 좋습니다.
// 여기서는 편의상 이 파일에 포함합니다.
declare global {
  namespace Express {
    interface Request {
      user?: DecodedToken;
    }
  }
}

// User type definition
import { ObjectId } from 'mongodb'; // Import ObjectId for User type
export type User = {
  _id?: ObjectId; // MongoDB's _id 필드
  id: string; // Our internal ID (e.g., Google ID)
  email: string;
  name: string;
  googleId: string;
};