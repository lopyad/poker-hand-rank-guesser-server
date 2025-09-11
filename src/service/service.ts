import { Repository, User } from "../repository/repository";
import { Failable } from "../types";

export class Service {
  constructor(private readonly repository: Repository) {}

  

  whoAmI() {
    console.log("Here is Service");
  }

  async processGoogleLogin(idToken: string): Promise<Failable<{ appToken: string }>> {
    // 1. 여기에 구글에 ID 토큰의 유효성을 검증하는 로직이 위치합니다.
    console.log("[Service] Verifying Google ID token...");
    // 검증 실패 시 에러를 반환할 수 있습니다.
    if (idToken === "invalid-token") {
      return [null, new Error("Invalid Google ID token.")];
    }
    const googleUserInfo = {
      googleId: "123456789",
      email: "test@example.com",
      name: "Test User",
    };

    // 2. 검증된 유저 정보를 데이터베이스에서 조회하거나 새로 저장합니다.
    let user: User | null;
    const [foundUser, findErr] = await this.repository.findUserByGoogleId(googleUserInfo.googleId);
    if (findErr) {
      return [null, findErr]; // DB 조회 에러 발생
    }

    if (foundUser) {
      user = foundUser;
    } else {
      // 유저가 없으면 새로 생성
      const [createdUser, createErr] = await this.repository.createUser(googleUserInfo);
      if (createErr) {
        return [null, createErr]; // DB 생성 에러 발생
      }
      user = createdUser;
    }

    if (!user) {
        return [null, new Error('Failed to get user.')];
    }

    // 3. 여기에 우리 서비스의 자체 JWT 토큰을 생성하는 로직이 위치합니다.
    console.log("[Service] Generating internal JWT...");
    const appToken = "internal-jwt-token-for-" + user.id;

    return [{ appToken }, null];
  }
}