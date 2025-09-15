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
import { Card, EvaluatedHand } from './core/types';

export type User = {
  _id?: ObjectId; // MongoDB's _id 필드
  id: string; // Our internal ID (e.g., Google ID)
  email: string;
  name: string;
  googleId: string;
};

export interface PlayerGameData {
    holeCards: Card[];
    evaluatedHand?: EvaluatedHand;
    guess: number; // Changed to required, 0 means no guess
    score: number;
}

export type PlayerState = {
  ws: WebSocket;
  isReady: boolean;
  name: string;
  gameData: PlayerGameData;
};

export type GameRoomState = 'lobby' | 'countdown' | 'in-game' | 'guessing' | 'results' | 'round_intermission' | 'waiting-for-next-round-ready';

export interface GameRoom {
  roomCode: string;
  players: Map<string, PlayerState>; // Map of playerId to player state
  whitelistedPlayers: Set<string>; // Players authorized to join
  maxPlayers: number; // Maximum number of players allowed
  state: GameRoomState;
  deck: Card[];
  communityCards: Card[];
}

export interface PlayerWithEvaluatedHandAndRank {
  playerId: string;
  playerState: PlayerState;
  evaluatedHand: EvaluatedHand;
  actualRank?: number;
}


/////////////////////// WEB SOCKET ////////////////////////////
export type FuncResponse<T> = [T, null] | [null, Error];

export interface CustomWebSocket extends WebSocket {
  roomCode?: string;
  // playerId?: string;
  userId: string;
}

// C2S: Client to Server Message Types
export interface C2S_JoinRoom {
  type: 'JOIN_ROOM';
  payload: {
    roomCode: string;
  };
}

export interface C2S_PlayerReady {
  type: 'PLAYER_READY';
  payload: {
    isReady: boolean;
  };
}

export interface C2S_SubmitGuess {
  type: 'SUBMIT_GUESS';
  payload: {
    guess: number; // 1, 2, 3, 4
  };
}

export interface C2S_NextRoundReady {
  type: 'NEXT_ROUND_READY';
  payload: {};
}

export type C2S_Message =
  | C2S_JoinRoom
  | C2S_PlayerReady
  | C2S_SubmitGuess
  | C2S_NextRoundReady;

// S2C: Server to Client Message Types
export interface S2C_Response {
  type: 'RESPONSE';
  payload: {
    success: boolean;
    message: string;
  };
}

export interface S2C_LobbyState {
  type: "LOBBY_STATE";
  payload: {
    players: {
      name: string;
      isReady: boolean;
    }[];
  };
}

export interface S2C_RoundStart {
  type: 'ROUND_START';
  payload: {
    holeCards: Card[];
    communityCards: Card[];
    playerName: string; // Added player name
  };
}

export interface S2C_ShowResults {
  type: 'SHOW_RESULTS';
  payload: {};
}

export interface S2C_GameStartCountdown {
  type: 'GAME_START_COUNTDOWN';
  payload: {
    duration: number; // in seconds
  };
}

export interface S2C_GameStarted {
  type: 'GAME_STARTED';
  payload: {};
}

export interface S2C_GameStartCancelled {
  type: 'GAME_START_CANCELLED';
  payload: {};
}

export interface S2C_RoundResult {
    type: 'ROUND_RESULT';
    payload: {
        results: {
            playerId: string;
            name: string;
            holeCards: Card[];
            evaluatedHand: EvaluatedHand;
            guess: number;
            actualRank: number;
            isCorrect: boolean;
            score: number;
        }[];
    };
}

export type S2C_Message =
  | S2C_Response
  | S2C_LobbyState
  | S2C_RoundStart
  | S2C_ShowResults
  | S2C_GameStartCountdown
  | S2C_GameStarted
  | S2C_GameStartCancelled
  | S2C_RoundResult;