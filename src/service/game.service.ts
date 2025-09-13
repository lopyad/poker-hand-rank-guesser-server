// New GameService class
import { WebSocket } from 'ws';
import { Failable, GameRoom, User } from '../types';
import { Repository } from '../repository/repository'; // For GameService

// New GameService class
export class GameService {
  private readonly gameManager: GameManager
  constructor(
    private readonly repository: Repository
  ) {
    this.gameManager = new GameManager();
    console.log('GameService initialized with Repository and GameManager.');
  }

  async getUserById(id: string): Promise<Failable<User>> {
      console.log(`[GameService] Getting user by ID: ${id}`);
      return this.repository.getUserById(id);
  }

  public createRoomForPlayer(playerId: string): string {
    console.log(`[GameService] Player ${playerId} is creating a room.`);
    const roomCode = this.gameManager.createRoom();
    // At this point, the room is created. The player will join via WebSocket later.
    return roomCode;
  }

  public getRoom(roomCode: string): GameRoom | undefined {
    return this.gameManager.getRoom(roomCode);
  }

  public addPlayerToRoomWhitelist(roomCode: string, playerId: string): Failable<boolean> {
    return this.gameManager.addPlayerToWhitelist(roomCode, playerId);
  }

  public checkAndWhitelistPlayer(roomCode: string, playerId: string): Failable<boolean> {
    const room = this.gameManager.getRoom(roomCode);
    if (!room) {
      console.log(`[GameService] Room ${roomCode} not found for checkAndWhitelistPlayer.`);
      return [null, new Error("fail to find room by roomCode")];
    }
    
    const [_, error] = this.gameManager.addPlayerToWhitelist(roomCode, playerId);
    if(error){
      return [null, error];
    }

    return [true, null];
    
  }

  public joinRoom(roomCode: string, playerId: string, ws: WebSocket): boolean {
    return this.gameManager.joinRoom(roomCode, playerId, ws);
  }

  public leaveRoom(roomCode: string, playerId: string): void {
    this.gameManager.leaveRoom(roomCode, playerId);
  }
}

// Original GameManager, now purely for game logic
class GameManager { // Removed export
  private rooms: Map<string, GameRoom> = new Map();
  private nextRoomId: number = 1;

  constructor() { // No repository here
    console.log('GameManager initialized.');
  }

  public createRoom(): string {
    const roomCode = this.generateUniqueRoomCode();
    const newRoom: GameRoom = {
      roomCode: roomCode,
      players: new Map<string, WebSocket>(),
      whitelistedPlayers: new Set<string>(), // Initialize whitelist
      maxPlayers: 4, // Set max players
    };
    this.rooms.set(roomCode, newRoom);
    console.log(`Room ${roomCode} created.`);
    return roomCode;
  }

  public addPlayerToWhitelist(roomCode: string, playerId: string): Failable<boolean> {
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

  public joinRoom(roomCode: string, playerId: string, ws: WebSocket): boolean {
    const room = this.rooms.get(roomCode);
    if (room) {
      room.players.set(playerId, ws);
      console.log(`Player ${playerId} joined room ${roomCode}.`);
      this.broadcastToRoom(roomCode, `Player ${playerId} has joined the room.`);
      return true;
    }
    console.log(`Room ${roomCode} not found for player ${playerId}.`);
    return false;
  }

  public leaveRoom(roomCode: string, playerId: string): void {
    const room = this.rooms.get(roomCode);
    if (room) {
      room.players.delete(playerId);
      console.log(`Player ${playerId} left room ${roomCode}.`);
      this.broadcastToRoom(roomCode, `Player ${playerId} has left the room.`);
      if (room.players.size === 0) {
        this.rooms.delete(roomCode);
        console.log(`Room ${roomCode} is empty and has been removed.`);
      }
    }
  }

  public broadcastToRoom(roomCode: string, message: string): void {
    const room = this.rooms.get(roomCode);
    if (room) {
      room.players.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
      });
    }
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