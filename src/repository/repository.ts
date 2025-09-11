import { Failable } from "../types";

// 유저 정보에 대한 타입을 정의합니다.
export type User = {
  id: string;
  email: string;
  name: string;
  googleId: string;
};

export class Repository {
  getHandRank(hand: string[]): string {
    return "High Card";
  }

  whoAmI() {
    console.log("Here is Repository");
  }

  async findUserByGoogleId(googleId: string): Promise<Failable<User>> {
    try {
      console.log(`[Repository] Finding user with googleId: ${googleId}`);
      // 데이터베이스 로직이 실패할 수 있다고 가정합니다.
      if (Math.random() > 0.5) {
        // 지금은 유저가 없다고 가정
        return [null, null];
      }
      // DB에서 찾은 유저 정보라고 가정
      const user: User = { id: 'found-user-id', googleId, email: 'found@example.com', name: 'Found User' };
      return [user, null];
    } catch (e) {
      return [null, new Error("Database error while finding user.")];
    }
  }

  async createUser(userData: Omit<User, 'id'>): Promise<Failable<User>> {
    try {
      console.log(`[Repository] Creating user: ${userData.name}`);
      const newUser: User = { id: "new-user-id", ...userData };
      return [newUser, null];
    } catch (e) {
      return [null, new Error("Database error while creating user.")];
    }
  }
}