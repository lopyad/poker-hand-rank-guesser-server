import { Repository } from "../repository/repository";
import { Failable, User } from "../types";
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';

// GOOGLE_CLIENT_ID는 .env 파일에서 불러옵니다.
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

// 애플리케이션 시작 시점에 GOOGLE_CLIENT_ID가 설정되었는지 확인합니다.
// 이 부분은 애플리케이션의 진입점(index.ts)에서 처리하는 것이 더 적절할 수 있습니다.
// 여기서는 Service가 의존하는 값임을 명시하기 위해 포함합니다.
if (!GOOGLE_CLIENT_ID) {
  console.error('환경 변수 GOOGLE_CLIENT_ID가 설정되지 않았습니다. 구글 클라우드 콘솔에서 OAuth 2.0 클라이언트 ID를 생성하여 .env 파일에 추가해주세요.');
  // 실제 프로덕션 환경에서는 애플리케이션을 종료하거나 적절한 에러 처리를 해야 합니다.
}

const client = new OAuth2Client(GOOGLE_CLIENT_ID!);

// JWT_SECRET은 .env 파일에서 불러옵니다.
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('환경 변수 JWT_SECRET이 설정되지 않았습니다. 보안을 위해 강력한 비밀 키를 .env 파일에 추가해주세요.');
  // 실제 프로덕션 환경에서는 애플리케이션을 종료하거나 적절한 에러 처리를 해야 합니다.
}

export class AuthService {
  constructor(private readonly repository: Repository) {}

  async processGoogleLogin(idToken: string): Promise<Failable<string>> {
    try {
      console.log("[AuthService] Verifying Google ID token...");
      
      // 1. Google ID 토큰 유효성 검증 (실제 구현)
      const ticket = await client.verifyIdToken({
        idToken: idToken,
        audience: GOOGLE_CLIENT_ID!, // 이 토큰이 우리 앱을 위해 발급되었는지 확인
      });
      const payload = ticket.getPayload();

      if (!payload) {
        return [null, new Error('Invalid Google ID token payload.')];
      }

      const googleId = payload.sub;
      const email = payload.email;
      const name = payload.name || ''; // 이름은 없을 수도 있으므로 기본값 설정
      const emailVerified = payload.email_verified;

      if (!emailVerified) {
        return [null, new Error('Google account email not verified.')];
      }
      if (!email) {
        return [null, new Error('Google account email not found in token.')];
      }

      const googleUserInfo = { googleId, email, name };

      // 2. 검증된 유저 정보를 데이터베이스에서 조회하거나 새로 저장합니다.
      let user: User | null;
      const [foundUser, findErr] = await this.repository.findUserByGoogleId(googleUserInfo.googleId);
      // if (findErr) {
      //   return [null, findErr]; // DB 조회 에러 발생
      // }

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

      // 3. 우리 서비스의 자체 JWT 토큰을 생성하는 로직이 위치합니다.
      console.log("[AuthService] Generating internal JWT...");
      const appToken = jwt.sign(
        { userId: user.id }, // Payload: 사용자 ID를 포함
        JWT_SECRET!,         // Secret Key: .env에서 불러온 비밀 키 사용
        { expiresIn: '1h' }  // 옵션: 토큰 만료 시간 (예: 1시간)
      );

      return [appToken, null];

    } catch (error: any) {
      console.error("[AuthService] Google ID token verification failed:", error.message);
      return [null, new Error(`Google ID token verification failed: ${error.message}`)];
    }
  }
}