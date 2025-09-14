// New GameService class
import { WebSocket } from 'ws';
import { FuncResponse, GameRoom, PlayerState, User, WebSocketResponse, CustomWebSocket } from '../types';
import { Repository } from '../repository/repository'; // For GameService

// New GameService class
export class GameService {
  readonly gameManager: GameManager
  constructor(
    private readonly repository: Repository
  ) {
    this.gameManager = new GameManager(this.repository);
  }

  async getUserById(id: string): Promise<FuncResponse<User>> {
      console.log(`[GameService] Getting user by ID: ${id}`);
      return this.repository.getUserById(id);
  }
}

class GameManager {
  private rooms: Map<string, GameRoom> = new Map();
  private countdowns: Map<string, NodeJS.Timeout> = new Map();
  private nextRoomId: number = 1;
  private repository: Repository;

  constructor(repository: Repository) {
    this.repository = repository;
  }

  public createRoom(): FuncResponse<string> {
    const roomCode = this.generateUniqueRoomCode();
    const newRoom: GameRoom = {
      roomCode: roomCode,
      players: new Map<string, PlayerState>(),
      whitelistedPlayers: new Set<string>(), // Initialize whitelist
      maxPlayers: 4, // Set max players
      state: 'lobby',
    };
    this.rooms.set(roomCode, newRoom);
    console.log(`Room ${roomCode} created.`);

    return [roomCode, null];
  }

  public addPlayerToWhitelist(roomCode: string, playerId: string): FuncResponse<boolean> {
    const room = this.rooms.get(roomCode);
    if (room) {
      if (room.whitelistedPlayers.size < room.maxPlayers) {
        room.whitelistedPlayers.add(playerId);
        console.log(`Player ${playerId} added to whitelist for room ${roomCode}.`);
        return [true, null];
      } else {
        console.log(`Room ${roomCode} is full. Cannot add player ${playerId} to whitelist.`);
        return [null, new Error("Room ${roomCode} is full.")];
      }
    }
    console.log(`Room ${roomCode} not found. Cannot add player ${playerId} to whitelist.`);
    return [null, new Error("Room ${roomCode} not found.")];
  }

  public async joinRoom(roomCode: string, playerId: string, ws: CustomWebSocket): Promise<FuncResponse<boolean>> {
    const room = this.rooms.get(roomCode);
    if(!room){
      return [null, new Error("invalid roomCode")];
    }
    if(!room.whitelistedPlayers.has(playerId)) {
      return [null, new Error("player isn't in whitelist")];
    }

    // Cancel countdown if a new player joins
    this._handleGameStartCondition(roomCode, true);

    const [user, error] = await this.repository.getUserById(playerId);
    if(error || !user){
      return [null, new Error("fail to find user")];
    }

    ws.roomCode = roomCode;
    ws.playerId = playerId;

    room.players.set(playerId, { ws, isReady: false, name: user.name });
    console.log(`Player ${playerId} joined room ${roomCode}.`);

    const playersPayload = Array.from(room.players.values()).map(playerState => ({
      name: playerState.name,
      isReady: playerState.isReady,
    }));

    const response: WebSocketResponse = {
      type: "LOBBY_STATE",
      payload: {
        players: playersPayload,
      }
    };

    this.broadcastToRoom(roomCode, response);
    return [true, null];
  }

  public async setPlayerReady(playerId: string, roomCode: string, isReady: boolean): Promise<FuncResponse<boolean>> {
    const room = this.rooms.get(roomCode);
    if (!room) {
      return [null, new Error("Room not found.")];
    }

    const playerState = room.players.get(playerId);
    if (!playerState) {
      return [null, new Error("Player not found in this room.")];
    }

    playerState.isReady = isReady;
    console.log(`Player ${playerId} in room ${roomCode} is now ${isReady ? 'ready' : 'not ready'}.`);

    const playersPayload = Array.from(room.players.values()).map(ps => ({
      name: ps.name,
      isReady: ps.isReady,
    }));

    const response: WebSocketResponse = {
      type: "LOBBY_STATE",
      payload: {
        players: playersPayload,
      },
    };

    this.broadcastToRoom(roomCode, response);

    // Check game start condition
    this._handleGameStartCondition(roomCode);

    return [true, null];
  }

  private _handleGameStartCondition(roomCode: string, forceCancel: boolean = false) {
    const room = this.rooms.get(roomCode);
    if (!room) return;

    const allPlayersReady = room.players.size > 0 && Array.from(room.players.values()).every(p => p.isReady);

    if ((!allPlayersReady || forceCancel) && room.state === 'countdown') {
      // Cancel countdown
      const timer = this.countdowns.get(roomCode);
      if (timer) {
        clearTimeout(timer);
        this.countdowns.delete(roomCode);
        room.state = 'lobby';
        this.broadcastToRoom(roomCode, { type: 'GAME_START_CANCELLED', payload: {} });
        console.log(`Countdown cancelled for room ${roomCode}.`);
      }
    } else if (allPlayersReady && room.state === 'lobby') {
      // Start countdown
      room.state = 'countdown';
      const countdownDuration = 5; // 5 seconds
      this.broadcastToRoom(roomCode, { type: 'GAME_START_COUNTDOWN', payload: { duration: countdownDuration } });
      console.log(`Countdown started for room ${roomCode}.`);

      const timer = setTimeout(() => {
        room.state = 'in-game';
        this.broadcastToRoom(roomCode, { type: 'GAME_STARTED', payload: {} });
        console.log(`Game started in room ${roomCode}.`);
        this.countdowns.delete(roomCode);
      }, countdownDuration * 1000);

      this.countdowns.set(roomCode, timer);
    }
  }

  public leaveRoom(roomCode: string, playerId: string): void {
    const room = this.rooms.get(roomCode);
    if (room) {
      room.players.delete(playerId);
      console.log(`Player ${playerId} left room ${roomCode}.`);

      if (room.players.size === 0) {
        const timer = this.countdowns.get(roomCode);
        if (timer) {
            clearTimeout(timer);
            this.countdowns.delete(roomCode);
        }
        this.rooms.delete(roomCode);
        console.log(`Room ${roomCode} is empty and has been removed.`);
      } else {
        this._handleGameStartCondition(roomCode, true); // Force cancel countdown
        const playersPayload = Array.from(room.players.values()).map(ps => ({
            name: ps.name,
            isReady: ps.isReady,
        }));
        this.broadcastToRoom(roomCode, { type: "LOBBY_STATE", payload: { players: playersPayload } });
      }
    }
  }

  public broadcastToRoom(roomCode: string, message: WebSocketResponse): FuncResponse<boolean> {
    const room = this.rooms.get(roomCode);
    if(!room){
      return [null, new Error("invalid roomCode")];
    }

    room.players.forEach(playerState => {
      if (playerState.ws.readyState === WebSocket.OPEN) {
        playerState.ws.send(JSON.stringify(message));
      }
    });
    return [true, null];
  }

  private generateUniqueRoomCode(): string {
    const code = `ROOM-${this.nextRoomId.toString().padStart(4, '0')}`;
    this.nextRoomId++;
    return code;
  }

  public getRoom(roomCode: string): GameRoom | undefined {
    return this.rooms.get(roomCode);
  }
}