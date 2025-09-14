/**
 * 작업의 결과를 나타내는 타입으로, 성공 시 [결과, null]을, 실패 시 [null, 에러]를 반환합니다.
 * @template T 성공 시의 결과 값 타입
 */
// export type Failable<T> = [T | null, Error | null];
/**
 * 작업의 결과를 나타내는 타입으로, 성공 시 [결과, null]을, 실패 시 [null, 에러]를 반환합니다.
 * @template T 성공 시의 결과 값 타입
 */
// export type Failable<T> = [T | null, Error | null];
export type Failable<T> = [T, null] | [null, Error];

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
import { WebSocket } from 'ws'; // New import for GameRoom

export type User = {
  _id?: ObjectId; // MongoDB's _id 필드
  id: string; // Our internal ID (e.g., Google ID)
  email: string;
  name: string;
  googleId: string;
};

export type PlayerState = {
  ws: WebSocket;
  isReady: boolean;
  name: string;
};

export type GameRoomState = 'lobby' | 'countdown' | 'in-game';

export interface GameRoom {
  roomCode: string;
  players: Map<string, PlayerState>; // Map of playerId to player state
  whitelistedPlayers: Set<string>; // Players authorized to join
  maxPlayers: number; // Maximum number of players allowed
  state: GameRoomState;
}


/////////////////////// WEB SOCKET ////////////////////////////
export type FuncResponse<T> = [T, null] | [null, Error];
// Extend WebSocket to store roomCode, playerId, and userId
export interface CustomWebSocket extends WebSocket {
  roomCode?: string;
  playerId?: string;
  userId?: string; // Add userId
}

export interface JoinRoomMessage {
  type: 'JOIN_ROOM'; // type을 구체적인 문자열 리터럴로 지정
  payload: {
    roomCode: string
  };
}

export interface PlayerReadyRequest {
  type: 'PLAYER_READY';
  payload: {
    isReady: boolean;
  };
}
export type WebSocketRequest =
  | JoinRoomMessage
  | ShowResultsMessage
  | PlayerReadyRequest;

// 각 메시지 타입을 명확하게 정의
export interface ResponseMessage {
  type: 'RESPONSE'; // type을 구체적인 문자열 리터럴로 지정
  payload: {
    success: boolean,
    message: string
  };
}

export interface LobbyStateResponse {
  type: "LOBBY_STATE";
  payload: {
    players: {
      name: string;
      isReady: boolean;
    }[];
  };
}

export interface RoundStartMessage {
  type: 'ROUND_START'; // type을 구체적인 문자열 리터럴로 지정
  payload: {};
}

export interface ShowResultsMessage {
  type: 'SHOW_RESULTS';
  payload: {}
}

export interface GameStartCountdownResponse {
  type: 'GAME_START_COUNTDOWN';
  payload: {
    duration: number; // in seconds
  };
}

export interface GameStartedResponse {
  type: 'GAME_STARTED';
  payload: {};
}

export interface GameStartCancelledResponse {
  type: 'GAME_START_CANCELLED';
  payload: {};
}

// 이들을 | (Union)으로 묶음
export type WebSocketResponse =
  | RoundStartMessage
  | ShowResultsMessage
  | ResponseMessage
  | LobbyStateResponse
  | GameStartCountdownResponse
  | GameStartedResponse
  | GameStartCancelledResponse;



