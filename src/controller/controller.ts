import { AuthService } from "../service/auth.service";
import { Service } from "../service/service";

import { ApiResponse, Failable, User } from "../types"; // Import Failable and User

export class Controller {
  constructor(private readonly authService: AuthService, private readonly generalService: Service) {}

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
}
