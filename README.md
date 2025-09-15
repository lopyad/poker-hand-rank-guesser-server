# 포커 핸드 랭크 추측 게임 서버 (Poker Hand Rank Guesser Server)

Gemini와 함께 개발한 포커 핸드 랭크 추측 게임의 서버입니다.

## 🃏 프로젝트 설명

이 프로젝트는 플레이어가 자신의 포커 핸드 랭크를 추측하는 웹 기반 게임의 백엔드 서버입니다. Express.js를 사용하여 RESTful API를 제공하고, WebSocket을 통해 실시간 게임 플레이를 지원합니다.

## ✨ 주요 기능

*   사용자 인증 (JWT 및 Google OAuth)
*   실시간 멀티플레이어 게임 플레이
*   포커 덱 관리 및 카드 분배
*   핸드 랭크 평가 로직
*   게임 상태 관리

## 🛠️ 사용된 기술

*   **언어:** TypeScript
*   **프레임워크:** Node.js, Express.js
*   **데이터베이스:** MongoDB
*   **실시간 통신:** WebSocket (`ws`)
*   **인증:** JSON Web Tokens (`jsonwebtoken`), Google Auth

## 🚀 시작하기

### 1. 프로젝트 클론

```bash
git clone <repository-url>
cd poker-hand-rank-guesser-server
```

### 2. 의존성 설치

```bash
npm ci
```

### 3. 환경 변수 설정

`.env` 파일을 생성하고 아래와 같이 필요한 환경 변수를 설정합니다.

```
# .env
PORT=3000
MONGO_URI=<your_mongodb_uri>
JWT_SECRET=<your_jwt_secret>
GOOGLE_CLIENT_ID=<your_google_client_id>
```

### 4. 서버 실행

```bash
npm start
```

서버가 `http://localhost:3000`에서 실행됩니다.

---

*이 README 파일은 Gemini를 사용하여 작성되었습니다.*