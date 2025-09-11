import { AuthService } from "../service/auth.service";
import { Service } from "../service/service";

import { ApiResponse } from "../types";

export class Controller {
  constructor(private readonly authService: AuthService, private readonly generalService: Service) {}

  whoAmI() {
    console.log("Here is Controller");
  }

  async handleGoogleLogin(idToken: string): Promise<ApiResponse<{ appToken: string }>> {
    console.log("[Controller] Received ID token from client.");
    const [result, error] = await this.authService.processGoogleLogin(idToken);

    if (error) {
      console.error("[Controller] Login failed:", error.message);
      return { success: false, message: error.message };
    }

    if (!result) {
      console.error("[Controller] Login failed: Result is null despite no error.");
      return { success: false, message: "Login failed due to unexpected null result." };
    }

    console.log("[Controller] Login processed successfully.");
    return { success: true, message: "Login successful", data: result };
  }
}