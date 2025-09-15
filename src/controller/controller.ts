import { AuthService } from "../service/auth.service";
import { Service } from "../service/service";
import { GameService } from "../service/game.service"; // Changed import
import { CustomWebSocket, FuncResponse, GameRoom, C2S_Message, S2C_Message } from "../types"; // Import GameRoom
import { WebSocket } from 'ws'; // Import WebSocket

import { ApiResponse, User } from "../types"; // Import Failable and User
import { BlobOptions } from "buffer";

export class Controller {
  constructor(
    private readonly authService: AuthService,
    private readonly generalService: Service,
    private readonly gameService: GameService // Changed parameter
  ) {}

  whoAmI() {
    console.log("Here is Controller");
  }

  async handleGoogleLogin(idToken: string): Promise<FuncResponse<string>> {
    console.log("[Controller] Received ID token from client.");
    const [result, error] = await this.authService.processGoogleLogin(idToken);

    if (error) {
      console.error("[Controller] Login failed:", error.message);
      return [null, error];
    }

    if (!result) {
      console.error("[Controller] Login failed: Result is null despite no error.");
      return [null, new Error("Login failed due to unexpected null result.")];
    }

    console.log("[Controller] Login processed successfully.");
    return [result, null];
  }

  async getUserProfile(userId: string): Promise<FuncResponse<User>> {
    console.log(`[Controller] Getting user profile for userId: ${userId}`);
    return this.generalService.getUserById(userId);
  }

  public createGameRoom(playerId: string): FuncResponse<string> {
    console.log(`[Controller] Creating a new game room for player ${playerId}.`);
    const [roomCode, error] = this.gameService.gameManager.createRoom();
    if(error){
      return [null, error];
    }

    return [roomCode, null];
  }

  public checkRoomJoinAndWhitelistPlayer(roomCode: string, playerId: string): FuncResponse<boolean> {
    const [_, error] = this.gameService.gameManager.addPlayerToWhitelist(roomCode, playerId);
    if(error){
      return [null, error];
    }

    return [true, null];
  }

  public async handleWebsocketMessage(message: C2S_Message, ws: CustomWebSocket): Promise<FuncResponse<boolean>>{
    if(!ws.userId){
      return [null, new Error("userId is missing")];
    }

    switch(message.type){
      case "JOIN_ROOM": {
        const [_, error] = await this.gameService.gameManager.joinRoom(message.payload.roomCode, ws);
        if(error){
          return [null, error];
        }
        break;
      }
      case "PLAYER_READY": {
        if (!ws.roomCode) {
          return [null, new Error("Player is not in a room.")];
        }
        const [_, error] = await this.gameService.gameManager.setPlayerReady(ws.userId, ws.roomCode, message.payload.isReady);
        if (error) {
          return [null, error];
        }
        break;
      }
      case "SUBMIT_GUESS": {
        if (!ws.roomCode) {
          return [null, new Error("Player is not in a room.")];
        }
        const [_, error] = await this.gameService.gameManager.submitGuess(ws.userId, ws.roomCode, message.payload.guess);
        if (error) {
          return [null, error];
        }
        break;
      }
      case "NEXT_ROUND_READY": {
        if (!ws.roomCode) {
          return [null, new Error("Player is not in a room.")];
        }
        const [_, error] = await this.gameService.gameManager.setPlayerNextRoundReady(ws.userId, ws.roomCode);
        if (error) {
          return [null, error];
        }
        break;
      }
    }

    return [true, null];
  }

  public leaveGameRoom(roomCode: string, playerId: string): void {
    this.gameService.gameManager.leaveRoom(roomCode, playerId);
  }
}
