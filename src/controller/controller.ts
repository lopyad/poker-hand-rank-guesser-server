import { AuthService } from "../service/auth.service";
import { Service } from "../service/service";

export class Controller {
  constructor(private readonly authService: AuthService, private readonly generalService: Service) {}

  whoAmI() {
    console.log("Here is Controller");
  }

  async handleGoogleLogin(idToken: string) {
    console.log("[Controller] Received ID token from client.");
    const [result, error] = await this.authService.processGoogleLogin(idToken);

    if (error) {
      console.error("[Controller] Login failed:", error.message);
      // 실제 애플리케이션에서는 HTTP 상태 코드를 다르게 설정해야 합니다. (예: 400, 500)
      return { success: false, message: error.message };
    }

    console.log("[Controller] Login processed successfully.");
    return { success: true, message: "Login successful", data: result };
  }
}