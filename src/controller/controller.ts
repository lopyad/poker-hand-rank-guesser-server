import { AuthService } from "../service/auth.service";
import { Service } from "../service/service";
import { GameService } from "../service/game.service"; // Changed import
import { GameRoom } from "../types"; // Import GameRoom
import { WebSocket } from 'ws'; // Import WebSocket

import { ApiResponse, Failable, User } from "../types"; // Import Failable and User

export class Controller {
  constructor(
    private readonly authService: AuthService,
    private readonly generalService: Service,
    private readonly gameService: GameService // Changed parameter
  ) {}

  whoAmI() {
    console.log("Here is Controller");
  }

  async handleGoogleLogin(idToken: string): Promise<Failable<string>> {
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

  async getUserProfile(userId: string): Promise<Failable<User>> {
    console.log(`[Controller] Getting user profile for userId: ${userId}`);
    return this.generalService.getUserById(userId);
  }

  public createGameRoom(playerId: string): string {
    console.log(`[Controller] Creating a new game room for player ${playerId}.`);
    return this.gameService.createRoomForPlayer(playerId);
  }

  public checkRoomJoinPossibility(roomCode: string, playerId: string): boolean {
    console.log(`[Controller] Delegating join possibility check for room ${roomCode} by player ${playerId} to GameService.`);
    return this.gameService.checkAndWhitelistPlayer(roomCode, playerId);
  }

  public getGameRoom(roomCode: string): GameRoom | undefined {
    return this.gameService.getRoom(roomCode);
  }

  public joinGameRoom(roomCode: string, playerId: string, ws: WebSocket): boolean {
    return this.gameService.joinRoom(roomCode, playerId, ws);
  }

  public leaveGameRoom(roomCode: string, playerId: string): void {
    this.gameService.leaveRoom(roomCode, playerId);
  }
}
