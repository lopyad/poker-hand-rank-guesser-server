// New GameService class
import { WebSocket } from 'ws';
import { FuncResponse, GameRoom, PlayerState, User, S2C_Message, CustomWebSocket, PlayerGameData, PlayerWithEvaluatedHandAndRank } from '../types';
import { Repository } from '../repository/repository'; // For GameService
import { createDeck, shuffleDeck, dealCards } from '../core/deck';
import { evaluatePlayerHand, compareEvaluatedHands } from '../core/hand-evaluator';
import { Card, EvaluatedHand } from '../core/types';

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
  private gameRoundTimeouts: Map<string, NodeJS.Timeout> = new Map(); // For managing timeouts for game rounds
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
      deck: [],
      communityCards: [],
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
    return [null, new Error(`Room ${roomCode} not found.`)];
  }

  public async joinRoom(roomCode: string, ws: CustomWebSocket): Promise<FuncResponse<boolean>> {
    const room = this.rooms.get(roomCode);
    if(!room){
      return [null, new Error("invalid roomCode")];
    }
    if(!room.whitelistedPlayers.has(ws.userId)) {
      return [null, new Error("player isn't in whitelist")];
    }

    const [user, error] = await this.repository.getUserById(ws.userId);
    if(error || !user){
      return [null, new Error(`fail to find user by ${ws.userId}`)];
    }

    ws.roomCode = roomCode;

    const initialGameData: PlayerGameData = { holeCards: [], score: 0, guess: 0 };
    room.players.set(ws.userId, { ws, isReady: false, name: user.name, gameData: initialGameData });
    console.log(`Player ${ws.userId} joined room ${roomCode}.`);

    // Cancel countdown if a new player joins
    this._handleGameStartCondition(roomCode, true);

    const playersPayload = Array.from(room.players.values()).map(player => ({
      name: player.name,
      isReady: player.isReady,
    }));

    const response: S2C_Message = {
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

    const player = room.players.get(playerId);
    if (!player) {
      return [null, new Error("Player not found in this room.")];
    }

    player.isReady = isReady;
    console.log(`Player ${playerId} in room ${roomCode} is now ${isReady ? 'ready' : 'not ready'}.`);

    const playersPayload = Array.from(room.players.values()).map(ps => ({
      name: ps.name,
      isReady: ps.isReady,
    }));

    const response: S2C_Message = {
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
        this.countdowns.delete(roomCode);
        this._startGame(roomCode);
      }, countdownDuration * 1000);

      this.countdowns.set(roomCode, timer);
    }
  }

  public async setPlayerNextRoundReady(playerId: string, roomCode: string): Promise<FuncResponse<boolean>> {
    const room = this.rooms.get(roomCode);
    if (!room) {
      return [null, new Error("Room not found.")];
    }

    const player = room.players.get(playerId);
    if (!player) {
      return [null, new Error("Player not found in this room.")];
    }

    if (room.state !== 'waiting-for-next-round-ready') {
      return [null, new Error("Not in waiting for next round ready phase.")];
    }

    player.isReady = true;
    console.log(`Player ${playerId} in room ${roomCode} is ready for the next round.`);

    const playersPayload = Array.from(room.players.values()).map(ps => ({
      name: ps.name,
      isReady: ps.isReady,
    }));

    this.broadcastToRoom(roomCode, {
      type: "LOBBY_STATE",
      payload: {
        players: playersPayload,
      },
    });

    const allPlayersReadyForNextRound = Array.from(room.players.values()).every(p => p.isReady);

    if (allPlayersReadyForNextRound) {
      console.log(`All players in room ${roomCode} are ready for the next round. Starting new round.`);
      this._startGame(roomCode);
    }

    return [true, null];
  }

  public async submitGuess(playerId: string, roomCode: string, guess: number): Promise<FuncResponse<boolean>> {
    const room = this.rooms.get(roomCode);
    if (!room) {
      return [null, new Error("Room not found.")];
    }
    if (room.state !== 'guessing') {
      console.log(`room.state: ${room.state}`);
      return [null, new Error("Not in guessing phase.")];
    }

    const player = room.players.get(playerId);
    if (!player) {
      return [null, new Error("Player not found in this room.")];
    }

    player.gameData.guess = guess;
    console.log(`Player ${playerId} in room ${roomCode} submitted guess: ${guess}`);

    const allGuessed = Array.from(room.players.values()).every(p => p.gameData.guess !== 0); // 0 means no guess

    if (allGuessed) {
      this._showResults(roomCode);
    }

    return [true, null];
  }

  private _startGame(roomCode: string) {
    const room = this.rooms.get(roomCode);
    if (!room) return;

    console.log(`Starting game in room ${roomCode}.`);
    room.state = 'in-game'; // Transition to in-game state

    // 1. Create and shuffle deck
    room.deck = shuffleDeck(createDeck());

    // 2. Deal community cards
    room.communityCards = dealCards(room.deck, 5);

    // 3. Deal hole cards and evaluate hands for each player
    room.players.forEach(player => {
      player.gameData.holeCards = dealCards(room.deck, 4);
      player.gameData.evaluatedHand = evaluatePlayerHand(player.gameData.holeCards, room.communityCards);

      // Send private hole cards and community cards to each player
      player.ws.send(JSON.stringify({
        type: 'ROUND_START',
        payload: {
          holeCards: player.gameData.holeCards,
          communityCards: room.communityCards,
          playerName: player.name,
        },
      } as S2C_Message));
    });

    room.state = 'guessing'; // Transition to guessing state
    console.log(`Room ${roomCode} is now in guessing phase.`);

    // // Set a timeout for guessing phase (e.g., 30 seconds), then show results
    // const guessingTimeout = 300; // seconds
    // const timeoutId = setTimeout(() => {
    //     console.log(`Guessing timeout for room ${roomCode}. Showing results.`);
    //     this._showResults(roomCode);
    // }, guessingTimeout * 1000);
    // this.gameRoundTimeouts.set(roomCode, timeoutId);
  }

  private _showResults(roomCode: string) {
    const room = this.rooms.get(roomCode);
    if (!room) return;

    // // Clear any active guessing timeout
    // const timeoutId = this.gameRoundTimeouts.get(roomCode);
    // if (timeoutId) {
    //     clearTimeout(timeoutId);
    //     this.gameRoundTimeouts.delete(roomCode);
    // }

    console.log(`Showing results for room ${roomCode}.`);
    room.state = 'results';

    // 1. Determine actual ranks
    const playersWithHands: PlayerWithEvaluatedHandAndRank[] = Array.from(room.players.entries()).map(([playerId, playerState]) => ({
        playerId,
        playerState,
        evaluatedHand: playerState.gameData.evaluatedHand as EvaluatedHand,
    }));

    // Sort players by hand rank (descending) and then by tie-breakers
    playersWithHands.sort((a, b) => compareEvaluatedHands(a.evaluatedHand, b.evaluatedHand) * -1); // * -1 for descending

    // Assign ranks (1-based)
    let actualRankCounter = 1;
    for (let i = 0; i < playersWithHands.length; i++) {
      if (i > 0 && compareEvaluatedHands(playersWithHands[i]!.evaluatedHand,
          playersWithHands[i-1]! .evaluatedHand) === 0) {
          // Same rank as previous player
          playersWithHands[i]!.actualRank = playersWithHands[i-1]!.actualRank!; // Assign the same rank as the previous player
      } else {
          playersWithHands[i]!.actualRank = actualRankCounter; // Assign a new rank
      }
      actualRankCounter++;
    }

    // 2. Prepare results payload and update scores
    const resultsPayload = playersWithHands.map(p => {
        const isCorrect = p.playerState.gameData.guess === p.actualRank;
        if (isCorrect) {
            p.playerState.gameData.score += 1; // Award 1 point for correct guess
        }
        return {
            playerId: p.playerId,
            name: p.playerState.name,
            holeCards: p.playerState.gameData.holeCards,
            evaluatedHand: p.evaluatedHand,
            guess: p.playerState.gameData.guess,
            actualRank: p.actualRank || 0, // Default to 0 if no rank
            isCorrect: isCorrect,
            score: p.playerState.gameData.score,
        };
    });

    // 3. Broadcast results
    this.broadcastToRoom(roomCode, { type: 'ROUND_RESULT', payload: { results: resultsPayload } });

    // 4. Transition to waiting for next round ready state
    const resultsDisplayDuration = 5; // seconds
    const timeoutId2 = setTimeout(() => {
        room.state = 'waiting-for-next-round-ready';
        // Reset player game data and ready status for the next round
        room.players.forEach(playerState => {
            playerState.isReady = false; // Players need to ready up again for the next round
            // holeCards and evaluatedHand are re-initialized in _startGame, so no need to reset here.
            playerState.gameData.guess = 0; // Reset guess to 0, indicating no guess made
        });

        // Broadcast updated lobby state to reflect ready status reset
        const playersPayload = Array.from(room.players.values()).map(ps => ({
            name: ps.name,
            isReady: ps.isReady,
        }));
        this.broadcastToRoom(roomCode, { type: "LOBBY_STATE", payload: { players: playersPayload } });
        console.log(`Room ${roomCode} transitioned to waiting for next round ready.`);
    }, resultsDisplayDuration * 1000);
    this.gameRoundTimeouts.set(roomCode, timeoutId2);
  }

  public leaveRoom(roomCode: string, playerId: string): void {
    const room = this.rooms.get(roomCode);
    if (room) {
      room.players.delete(playerId);
      console.log(`Player ${playerId} left room ${roomCode}.`);

      // Clear any game round timeout if player leaves during guessing/results
      const gameTimeoutId = this.gameRoundTimeouts.get(roomCode);
      if (gameTimeoutId) {
          clearTimeout(gameTimeoutId);
          this.gameRoundTimeouts.delete(roomCode);
      }

      if (room.players.size === 0) {
        const timer = this.countdowns.get(roomCode);
        if (timer) {
            clearTimeout(timer);
            this.countdowns.delete(roomCode);
        }
        this.rooms.delete(roomCode);
        console.log(`Room ${roomCode} is empty and has been removed.`);
      } else {
        // If players remain, check countdown condition and update lobby
        // Force cancel any ongoing countdown or game phase
        this._handleGameStartCondition(roomCode, true); 
        
        // Broadcast updated lobby state to reflect player leaving
        const playersPayload = Array.from(room.players.values()).map(ps => ({
            name: ps.name,
            isReady: ps.isReady,
        }));
        this.broadcastToRoom(roomCode, { type: "LOBBY_STATE", payload: { players: playersPayload } });
      }
    }
  }

  public broadcastToRoom(roomCode: string, message: S2C_Message): FuncResponse<boolean> {
    const room = this.rooms.get(roomCode);
    if(!room){
      return [null, new Error("invalid roomCode")];
    }

    room.players.forEach(player => {
      if (player.ws.readyState === WebSocket.OPEN) {
        player.ws.send(JSON.stringify(message));
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